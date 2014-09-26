define([
	"require",
	"dojo/aspect",
	"dojo/_base/declare", // declare
	"dojo/Deferred", // Deferred
	"dojo/dom", // dom.isDescendant
	"dojo/dom-class", // domClass.add domClass.contains
	"dojo/dom-geometry", // domGeometry.position
	"dojo/dom-style", // domStyle.set
	"dojo/_base/fx", // fx.fadeIn fx.fadeOut
	"dojo/keys",
	"dojo/_base/lang", // lang.mixin lang.hitch
	"dojo/on",
	"dojo/has", // has("dojo-bidi")
	"dojo/window", // winUtils.getBox, winUtils.get
	"dojo/dnd/Moveable", // Moveable
	"../activationTracker",
	"../Widget",
	"../_TemplatedMixin",
	"../CssState",
	"../FormWidget",
	"./DialogBase",
	"../DialogUnderlay",
	"../DialogLevelManagaer",
	"../layout/ContentPane",
	"../layout/utils",
	"dojo/text!./templates/Dialog.html",
	"dojo/i18n!../nls/common"
], function (require, aspect, declare, Deferred, dom, domClass, domGeometry, domStyle, fx, keys, lang, on, has,
			 winUtils, Moveable, focus, Widget, _TemplatedMixin, CssState, _FormMixin, DialogBase,
			 DialogUnderlay, DialogLevelManager, ContentPane, utils, template, nlsCommon) {

	// module:
	//		dui/Dialog

	var resolvedDeferred = new Deferred();
	resolvedDeferred.resolve(true);

	var _DialogBase = declare("dui._DialogBase" + (has("dojo-bidi") ? "_NoBidi" : ""),
			[_TemplatedMixin, _FormMixin, DialogBase, CssState], {
		templateString: template,

		baseClass: "duiDialog",

		cssStateNodes: {
			closeButtonNode: "duiDialogCloseIcon"
		},

		// Map widget attributes to DOMNode attributes.
		_setTitleAttr: { node: "titleNode", type: "innerHTML" },

		// open: [readonly] Boolean
		//		True if Dialog is currently displayed on screen.
		open: false,

		// duration: Integer
		//		The time in milliseconds it takes the dialog to fade in and out
		duration: 200,

		// refocus: Boolean
		//		A Toggle to modify the default focus behavior of a Dialog, which
		//		is to re-focus the element which had focus before being opened.
		//		False will disable refocusing. Default: true
		refocus: true,

		// focusOnOpen: Boolean
		//		A Toggle to modify the default focus behavior of a Dialog, which
		//		is to focus on the first dialog element after opening the dialog.
		//		False will disable autofocusing. Default: true
		focusOnOpen: true,

		// _firstFocusItem: [private readonly] DomNode
		//		The pointer to the first focusable node in the dialog.
		//		Set by `dui/DialogBase._getFocusItems()`.
		_firstFocusItem: null,

		// _lastFocusItem: [private readonly] DomNode
		//		The pointer to which node has focus prior to our dialog.
		//		Set by `dui/DialogBase._getFocusItems()`.
		_lastFocusItem: null,

		// draggable: Boolean
		//		Toggles the movable aspect of the Dialog. If true, Dialog
		//		can be dragged by it's title. If false it will remain centered
		//		in the viewport.
		draggable: true,
		_setDraggableAttr: function (/*Boolean*/ val) {
			// Avoid Widget behavior of copying draggable attribute to this.domNode,
			// as that prevents text select on modern browsers (#14452)
			this._set("draggable", val);
		},

		// maxRatio: Number
		//		Maximum size to allow the dialog to expand to, relative to viewport size
		maxRatio: 0.9,

		// closable: Boolean
		//		Dialog show [x] icon to close itself, and ESC key will close the dialog.
		closable: true,
		_setClosableAttr: function (val) {
			this.closeButtonNode.style.display = val ? "" : "none";
			this._set("closable", val);
		},

		postMixInProperties: function () {
			lang.mixin(this, nlsCommon);
			this.inherited(arguments);
		},

		postRender: function () {
			domStyle.set(this.domNode, {
				display: "none",
				position: "absolute"
			});
			this.ownerDocument.body.appendChild(this.domNode);

			this.inherited(arguments);

			aspect.after(this, "onExecute", lang.hitch(this, "hide"), true);
			aspect.after(this, "onCancel", lang.hitch(this, "hide"), true);

			this._modalconnects = [];
		},

		onLoad: function () {
			// summary:
			//		Called when data has been loaded from an href.
			//		Unlike most other callbacks, this function can be connected to (via `dojo.connect`)
			//		but should *not* be overridden.
			// tags:
			//		callback

			// when href is specified we need to reposition the dialog after the data is loaded
			// and find the focusable elements
			this.resize();
			this._position();

			if (this.focusOnOpen && DialogLevelManager.isTop(this)) {
				this._getFocusItems(this.domNode);
				focus.focus(this._firstFocusItem);
			}

			this.inherited(arguments);
		},

		focus: function () {
			this._getFocusItems(this.domNode);
			focus.focus(this._firstFocusItem);
		},

		_endDrag: function () {
			// summary:
			//		Called after dragging the Dialog. Saves the position of the dialog in the viewport,
			//		and also adjust position to be fully within the viewport, so user doesn't lose access to handle
			var nodePosition = domGeometry.position(this.domNode),
				viewport = winUtils.getBox(this.ownerDocument);
			nodePosition.y = Math.min(Math.max(nodePosition.y, 0), (viewport.h - nodePosition.h));
			nodePosition.x = Math.min(Math.max(nodePosition.x, 0), (viewport.w - nodePosition.w));
			this._relativePosition = nodePosition;
			this._position();
		},

		_setup: function () {
			// summary:
			//		Stuff we need to do before showing the Dialog for the first
			//		time (but we defer it until right beforehand, for
			//		performance reasons).
			// tags:
			//		private

			var node = this.domNode;

			if (this.titleBar && this.draggable) {
				this._moveable = new Moveable(node, { handle: this.titleBar });
				aspect.after(this._moveable, "onMoveStop", lang.hitch(this, "_endDrag"), true);
			} else {
				domClass.add(node, "duiDialogFixed");
			}

			this.underlayAttrs = {
				dialogId: this.id,
				"class": this["class"].split(/\s/).map(function (s) {
					return s + "_underlay";
				}).join(" "),
				ownerDocument: this.ownerDocument
			};
		},

		_position: function () {
			// summary:
			//		Position the dialog in the viewport.  If no relative offset
			//		in the viewport has been determined (by dragging, for instance),
			//		center the dialog.  Otherwise, use the Dialog's stored relative offset,
			//		adjusted by the viewport's scroll.

			// don't do anything if called during auto-scroll
			if (!domClass.contains(this.ownerDocument.body, "dojoMove")) {
				var node = this.domNode,
					viewport = winUtils.getBox(this.ownerDocument),
					p = this._relativePosition,
					bb = p ? null : domGeometry.position(node),
					l = Math.floor(viewport.l + (p ? p.x : (viewport.w - bb.w) / 2)),
					t = Math.floor(viewport.t + (p ? p.y : (viewport.h - bb.h) / 2))
					;
				domStyle.set(node, {
					left: l + "px",
					top: t + "px"
				});
			}
		},

		keyDownHandler: function (/*Event*/ evt) {
			// summary:
			//		Handles the keyboard events for accessibility reasons
			// tags:
			//		private

			if (evt.keyCode === keys.TAB) {
				this._getFocusItems(this.domNode);
				var node = evt.target;
				if (this._firstFocusItem === this._lastFocusItem) {
					// don't move focus anywhere, but don't allow browser to move focus off of dialog either
					evt.stopPropagation();
					evt.preventDefault();
				} else if (node === this._firstFocusItem && evt.shiftKey) {
					// if we are shift-tabbing from first focusable item in dialog, send focus to last item
					focus.focus(this._lastFocusItem);
					evt.stopPropagation();
					evt.preventDefault();
				} else if (node === this._lastFocusItem && !evt.shiftKey) {
					// if we are tabbing from last focusable item in dialog, send focus to first item
					focus.focus(this._firstFocusItem);
					evt.stopPropagation();
					evt.preventDefault();
				}
			} else if (this.closable && evt.keyCode === keys.ESCAPE) {
				this.onCancel();
				evt.stopPropagation();
				evt.preventDefault();
			}
		},

		show: function () {
			// summary:
			//		Display the dialog
			// returns: dojo/promise/Promise
			//		Promise object that resolves when the display animation is complete

			if (this.open) {
				return resolvedDeferred.promise;
			}

			if (!this.started) {
				this.startup();
			}

			// first time we show the dialog, there's some initialization stuff to do
			if (!this._alreadyInitialized) {
				this._setup();
				this._alreadyInitialized = true;
			}

			if (this._fadeOutDeferred) {
				// There's a hide() operation in progress, so cancel it, but still call DialogLevelManager.hide()
				// as though the hide() completed, in preparation for the DialogLevelManager.show() call below.
				this._fadeOutDeferred.cancel();
				DialogLevelManager.hide(this);
			}

			// Recenter Dialog if user scrolls browser.  Connecting to document doesn't work on IE, need to use window.
			// Be sure that event object doesn't get passed to resize() method, because it's expecting an optional
			// {w: ..., h:...} arg.
			var win = winUtils.get(this.ownerDocument);
			this._modalconnects.push(on(win, "scroll", lang.hitch(this, "resize", null)));

			this._modalconnects.push(on(win, "keydown", lang.hitch(this, "keyDownHandler")));

			domStyle.set(this.domNode, {
				opacity: 0,
				display: ""
			});

			this._set("open", true);
			this._onShow(); // lazy load trigger

			this.resize();
			this._position();

			// fade-in Animation object, setup below
			var fadeIn;

			this._fadeInDeferred = new Deferred(lang.hitch(this, function () {
				fadeIn.stop();
				delete this._fadeInDeferred;
			}));

			// If delay is 0, code below will delete this._fadeInDeferred instantly, so grab promise while we can.
			var promise = this._fadeInDeferred.promise;

			fadeIn = fx.fadeIn({
				node: this.domNode,
				duration: this.duration,
				beforeBegin: lang.hitch(this, function () {
					DialogLevelManager.show(this, this.underlayAttrs);
				}),
				onEnd: lang.hitch(this, function () {
					if (this.focusOnOpen && DialogLevelManager.isTop(this)) {
						// find focusable items each time dialog is shown since if dialog contains a widget the
						// first focusable items can change
						this._getFocusItems(this.domNode);
						focus.focus(this._firstFocusItem);
					}
					this._fadeInDeferred.resolve(true);
					delete this._fadeInDeferred;
				})
			}).play();

			return promise;
		},

		hide: function () {
			// summary:
			//		Hide the dialog
			// returns: dojo/promise/Promise
			//		Promise object that resolves when the display animation is complete

			// If we haven't been initialized yet then we aren't showing and we can just return.
			// Likewise if we are already hidden, or are currently fading out.
			if (!this._alreadyInitialized || !this.open) {
				return resolvedDeferred.promise;
			}
			if (this._fadeInDeferred) {
				this._fadeInDeferred.cancel();
			}

			// fade-in Animation object, setup below
			var fadeOut;

			this._fadeOutDeferred = new Deferred(lang.hitch(this, function () {
				fadeOut.stop();
				delete this._fadeOutDeferred;
			}));

			// fire onHide when the promise resolves.
			var _this = this;
			this._fadeOutDeferred.then(function () { _this.onHide(); });

			// If delay is 0, code below will delete this._fadeOutDeferred instantly, so grab promise while we can.
			var promise = this._fadeOutDeferred.promise;

			fadeOut = fx.fadeOut({
				node: this.domNode,
				duration: this.duration,
				onEnd: lang.hitch(this, function () {
					this.domNode.style.display = "none";
					DialogLevelManager.hide(this);
					this._fadeOutDeferred.resolve(true);
					delete this._fadeOutDeferred;
				})
			}).play();

			if (this._scrollConnected) {
				this._scrollConnected = false;
			}
			var h;
			while ((h = this._modalconnects.pop())) {
				h.remove();
			}

			if (this._relativePosition) {
				delete this._relativePosition;
			}
			this._set("open", false);

			return promise;
		},

		resize: function (dim) {
			// summary:
			//		Called with no argument when viewport scrolled or viewport size changed.  Adjusts Dialog as
			//		necessary to keep it visible.
			//
			//		Can also be called with an argument (by dojox/layout/ResizeHandle etc.) to explicitly set the
			//		size of the dialog.
			// dim: Object?
			//		Optional dimension object like {w: 200, h: 300}

			/* jshint maxcomplexity:11 */
			if (this.domNode.style.display !== "none") {

				this._checkIfSingleChild();

				if (!dim) {
					if (this._shrunk) {
						// If we earlier shrunk the dialog to fit in the viewport, reset it to its natural size
						if (this._singleChild) {
							if (typeof this._singleChildOriginalStyle !== "undefined") {
								this._singleChild.domNode.style.cssText = this._singleChildOriginalStyle;
								delete this._singleChildOriginalStyle;
							}
						}
						[this.domNode, this.containerNode, this.titleBar].forEach(function (node) {
							domStyle.set(node, {
								position: "static",
								width: "auto",
								height: "auto"
							});
						});
						this.domNode.style.position = "absolute";
					}

					// If necessary, shrink Dialog to fit in viewport and have some space around it
					// to indicate that it's a popup.  This will also compensate for possible scrollbars on viewport.
					var viewport = winUtils.getBox(this.ownerDocument);
					viewport.w *= this.maxRatio;
					viewport.h *= this.maxRatio;

					var bb = domGeometry.position(this.domNode);
					if (bb.w >= viewport.w || bb.h >= viewport.h) {
						dim = {
							w: Math.min(bb.w, viewport.w),
							h: Math.min(bb.h, viewport.h)
						};
						this._shrunk = true;
					} else {
						this._shrunk = false;
					}
				}

				// Code to run if user has requested an explicit size, or the shrinking code above set an implicit size
				if (dim) {
					// Set this.domNode to specified size
					domGeometry.setMarginBox(this.domNode, dim);

					// And then size this.containerNode
					var contentDim = utils.marginBox2contentBox(this.domNode, dim),
						centerSize = {domNode: this.containerNode, region: "center"};
					utils.layoutChildren(this.domNode, contentDim,
						[
							{domNode: this.titleBar, region: "top"},
							centerSize
						]);

					// And then if this.containerNode has a single layout widget child, size it too.
					// Otherwise, make this.containerNode show a scrollbar if it's overflowing.
					if (this._singleChild) {
						var cb = utils.marginBox2contentBox(this.containerNode, centerSize);
						// note: if containerNode has padding singleChildSize will have l and t set,
						// but don't pass them to resize() or it will doubly-offset the child
						this._singleChild.resize({w: cb.w, h: cb.h});
						// TODO: save original size for restoring it on another show()?
					} else {
						this.containerNode.style.overflow = "auto";
						this._layoutChildren();		// send resize() event to all child widgets
					}
				} else {
					this._layoutChildren();		// send resize() event to all child widgets
				}

				if (!has("touch") && !dim) {
					// If the user has scrolled the viewport then reposition the Dialog.  But don't do it for touch
					// devices, because it will counteract when a keyboard pops up and then the browser auto-scrolls
					// the focused node into view.
					this._position();
				}
			}
		},

		_layoutChildren: function () {
			// Override _ContentPaneResizeMixin._layoutChildren because even when there's just a single layout child
			// widget, sometimes we don't want to size it explicitly (i.e. to pass a dim argument to resize())

			this.getChildren().forEach(function (widget) {
				if (widget.resize) {
					widget.resize();
				}
			});
		},

		destroy: function () {
			if (this._fadeInDeferred) {
				this._fadeInDeferred.cancel();
			}
			if (this._fadeOutDeferred) {
				this._fadeOutDeferred.cancel();
			}
			if (this._moveable) {
				this._moveable.destroy();
			}
			var h;
			while ((h = this._modalconnects.pop())) {
				h.remove();
			}

			DialogLevelManager.hide(this);

			this.inherited(arguments);
		}
	});

	if (has("bidi")) {
		_DialogBase = declare("dui._DialogBase", _DialogBase, {
			_setTitleAttr: function (/*String*/ title) {
				this._set("title", title);
				this.titleNode.innerHTML = title;
				this.applyTextDir(this.titleNode);
			},

			_setTextDirAttr: function (textDir) {
				if (this.created && this.textDir !== textDir) {
					this._set("textDir", textDir);
					this.set("title", this.title);
				}
			}
		});
	}

	var Dialog = declare("dui.Dialog", [ContentPane, _DialogBase], {
		// summary:
		//		A modal dialog Widget.
		// description:
		//		Pops up a modal dialog window, blocking access to the screen
		//		and also graying out the screen Dialog is extended from
		//		ContentPane so it supports all the same parameters (href, etc.).
		// example:
		// |	<div data-dojo-type="dui/Dialog" data-dojo-props="href: 'test.html'"></div>
		// example:
		// |	var foo = new Dialog({ title: "test dialog", content: "test content" });
		// |	foo.placeAt(win.body());
		// |	foo.startup();
	});
	Dialog._DialogBase = _DialogBase;	// for monkey patching and dojox/widget/DialogSimple

	return Dialog;
});
