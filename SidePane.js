define(
	["./register",
		"./Widget",
		"./Container",
		"./Contained",
		"./Invalidating",
		"dojo/_base/lang",
		"dojo/dom-class",
		"dojo/_base/window",
		"dojo/touch",
		"dojo/on",
		"dojo/sniff",
		"./themes/load!./themes/{{theme}}/SidePane"],
	function (register, Widget, Container, Contained, Invalidating, lang, domClass, win, touch, on, has) {
		var cssMap = {start: {push: "start-push", overlay: "start-overlay", reveal: "start-reveal"},
			end: {push: "end-push", overlay: "end-overlay", reveal: "end-reveal"}};
		var prefix = function (v) {
			return "-d-side-pane-" + v;
		}
		return register("d-side-pane", [HTMLElement, Widget, Container, Contained, Invalidating], {

			// summary:
			//		A container displayed on the side of the screen. It can be displayed on top of the page
			// 		(mode=overlay) or
			//		can push the content of the page (mode=push or mode=reveal).
			// description:
			//		SidePane is an interactive container hidden by default. To open it, swipe the screen from the
			// border to the center of the page.
			//		To close it, swipe horizontally the panel in the other direction.
			//		This widget must be a sibling of html's body element or use the entire screen.
			//		If mode is set to "push" or "reveal", the width of the SidePane can't be changed in the markup
			//		(15em by default).
			//		However it can be changed in SidePane.less (@PANE_WIDTH variable) to regenerate SidePane.css.
			//		In "push" and "reveal" mode, the pushed element is the first sibling of the SidePane which is
			//		of type element
			//		(nodeType == 1) and not a SidePane.

			// baseClass: String
			//		The name of the CSS class of this widget.
			baseClass: "d-side-pane",

			// mode: String
			//		Can be "overlay", "reveal" or "push". Default is "push".
			mode: "push",

			// position: String
			//		Can be "start" or "end". If set to "start", the panel is displayed on the
			//		left side in left-to-right mode.
			position: "start",

			// swipeOpening: Boolean
			//		Enables the swipe opening of the pane.
			swipeOpening: false,

			// swipeClosing: Boolean
			//		Enables the swipe closing of the pane.
			swipeClosing: false,

			_transitionTiming: {default: 0, chrome: 50, ios: 20, android: 100, mozilla: 100},

			_timing: 0,

			open: function () {
				// summary:
				//		Open the panel.

				if (this.style.display === "none") {
					// The dom node has to be visible to be animated. If it's not visible, postpone the opening to
					//		enable animation.
					this.style.display = "";
					setTimeout(lang.hitch(this, this._openImpl), this._timing);
				} else {
					this._openImpl();
				}

				var opts = {bubbles: true, cancelable: true, detail: this};
				on.emit(this, "showStart", opts);

			},

			close: function () {
				// summary:
				//		Close the panel.
				this._hideImpl();

				//TODO: Too early regarding current livecycle
				//var opts = {bubbles: true, cancelable: true, detail: this};
				// on.emit(this,"hideStart", opts);
			},

			_visible: false,
			_opening: false,
			_originX: NaN,
			_originY: NaN,
			_cssClasses: {},

			_setPositionAttr: function (value) {
				this._set("position", value);
				this.style.display = "none";
				this.buildRendering();
			},

			_getStateAttr: function () {
				return this._visible ? "open" : "close";
			},

			_setSwipeClosingAttr: function (value) {
				this.swipeClosing = value;
				this._resetInteractions();
			},

			_setSwipeOpeningAttr: function (value) {
				this.swipeOpening = value;
				this._resetInteractions();
			},

			postCreate: function () {

				this.style.display = "none";
			},

			preCreate: function () {
				this.addInvalidatingProperties("position", "mode");
			},

			buildRendering: function () {
				console.log("build");
//				this._cleanCSS();
				this.parentNode.style.overflow = "hidden";
				this._resetInteractions();
				this.invalidateRendering();
			},

			_firstRendering: true,

			refreshRendering: function (props) {
				var fullRefresh = this._firstRendering || Object.getOwnPropertyNames(props).length === 0;
				this._firstRendering = false;
				if (fullRefresh || props.mode) {
					domClass.remove(this, prefix("push"));
					domClass.remove(this, prefix("overlay"));
					domClass.remove(this, prefix("reveal"));
					domClass.add(this, prefix(this.mode));
					if (this.mode === "overlay") {
						this.style["z-index"] = 1;
					}
					else if (this.mode === "reveal") {
						this.style["z-index"] = -1;
					}
				}
				if (fullRefresh || props.position) {
					domClass.remove(this, prefix("start"));
					domClass.remove(this, prefix("end"));
					domClass.add(this, prefix(this.position));
				}
				if (fullRefresh) {
					if (this._visible) {
						domClass.remove(this, prefix("hidden"));
						domClass.add(this, prefix("visible"));
					} else {
						domClass.remove(this, prefix("visible"));
						domClass.add(this, prefix("hidden"));
					}
				}
				if (this._timing === 0) {
					for (var o in this._transitionTiming) {
						if (has(o) && this._timing < this._transitionTiming[o]) {
							this._timing = this._transitionTiming[o];
						}
					}
				}
			},
			_openImpl: function () {
				if (!this._visible) {
					this._visible = true;
					domClass.remove(this, prefix("hidden"));
					domClass.add(this, prefix("visible"));
					if (this.mode === "push" || this.mode === "reveal") {
						var nextElement = this.getNextSibling();
						if (nextElement) {
							domClass.remove(nextElement, prefix("nottranslated"));
							domClass.remove(nextElement, prefix("start"));
							domClass.remove(nextElement, prefix("end"));
							domClass.add(nextElement, prefix(this.position));
							domClass.add(nextElement, prefix("translated"));
						}
					}
				}
			},

			_hideImpl: function () {
				if (this._visible) {
					this._visible = false;
					this._opening = false;
					domClass.remove(win.doc.body, prefix("no-select"));
					domClass.remove(this, prefix("visible"));
					domClass.add(this, prefix("hidden"));
					if (this.mode === "push" || this.mode === "reveal") {
						var nextElement = this.getNextSibling();
						if (nextElement) {
							domClass.remove(nextElement, prefix("translated"));
							domClass.remove(nextElement, prefix("start"));
							domClass.remove(nextElement, prefix("end"));
							domClass.add(nextElement, prefix(this.position));
							domClass.add(nextElement, prefix("nottranslated"));
						}
					}
				}
			},

			_touchPress: function (event) {
				this._originX = event.pageX;
				this._originY = event.pageY;

				if (this.style.display === "none") {
					this.style.display = "";
				}

				if (this._visible || (this.position === "start" && !this._visible && this._originX <= 10) ||
					(this.position === "end" && !this._visible && this._originX >= win.doc.width - 10)) {
					this._opening = !this._visible;
					this._pressHandle.remove();
					this._moveHandle = on(win.doc, touch.move, lang.hitch(this, this._touchMove));
					this._releaseHandle = on(win.doc, touch.release, lang.hitch(this, this._touchRelease));

					this._addClass(win.doc.body, "-d-side-pane-no-select");
				}
			},

			_touchMove: function (event) {
				if (!this._opening && Math.abs(event.pageY - this._originY) > 10) {
					this._resetInteractions();
				} else {
					var pos = event.pageX;

					if (this.position === "start") {
						if (this.swipeOpening && !this._visible && (pos - this._originX) > 10) {
							this.open();
						} else if (this._visible) {
							if (this._originX < pos) {
								this._originX = pos;
							}

							if ((this.swipeClosing && this._originX - pos) > 10) {
								this.close();
								this._originX = pos;
							}
						}
					} else {
						if (this.swipeOpening && !this._visible && (this._originX - pos) > 10) {
							this.open();
						} else if (this._visible) {
							if (this._originX > pos) {
								this._originX = pos;
							}
							if ((this.swipeClosing && pos - this._originX) > 10) {
								this.close();
								this._originX = pos;
							}
						}
					}
				}
			},

			_touchRelease: function () {
				this._opening = false;
				this._removeClass(win.doc.body, "-d-side-pane-no-select");
				this._resetInteractions();
			},

			_resetInteractions: function () {
				if (this._releaseHandle) {
					this._releaseHandle.remove();
				}
				if (this._moveHandle) {
					this._moveHandle.remove();
				}
				if (this._pressHandle) {
					this._pressHandle.remove();
				}
				var elt = this._visible ? this : win.doc;

				if (this.style.display === "none" || this.swipeOpening || this.swipeClosing) {
					this._pressHandle = on(elt, touch.press, lang.hitch(this, this._touchPress));
				}

				this._originX = NaN;
				this._originY = NaN;
			},

			_cssClassGen: function (suffix) {

				if (suffix.indexOf("-d-side-pane") === 0) {
					// Already a mobile class
					return suffix;
				} else {
					return "-d-side-pane-" + cssMap[this.position][this.mode] + suffix;
				}
			},

			_addClass: function (node, suffix) {
				var cls = this._cssClassGen(suffix);
				domClass.add(node, cls);
				if (this._cssClasses[cls]) {
					this._cssClasses[cls].push(node);
				} else {
					this._cssClasses[cls] = [node];
				}
			},
			_removeClass: function (node, suffix) {
				var cls = this._cssClassGen(suffix);
				domClass.remove(node, cls);
				if (this._cssClasses[cls]) {
					var i = this._cssClasses[cls].indexOf(node);
					if (i !== -1) {
						this._cssClasses[cls].splice(i, 1);
					}
				} else {
					this._cssClasses[cls] = [node];
				}
			},

			_changeClass: function (node, toAdd, toRemove) {
				this._addClass(node, toAdd);
				this._removeClass(node, toRemove);
			},

			_cleanCSS: function () {
				for (var cls in this._cssClasses) {
					for (var i = 0; i < this._cssClasses[cls].length; i++) {
						this._removeClass(this._cssClasses[cls][i], cls);
					}
				}
				this._cssClasses = {};
			},
			destroy: function () {
				this._cleanCSS();

				if (this._pressHandle) {
					this._pressHandle.remove();
				}
				if (this._moveHandle) {
					this._moveHandle.remove();
				}
				if (this._releaseHandle) {
					this._releaseHandle.remove();
				}
			}
		});
	});

