---
layout: doc
title: delite/Selection
---

# delite/Selection

`delite/Selection` is a [`delite/Widget`](Widget.md) subclass which adds the ability for a widget to manage the
selection state of its internal items.

This is typically used in conjunction with [`delite/StoreMap`](StoreMap.md) to manage the selection of the data
 or render items created by the store mixin.

##### Table of Contents
[Using Selection](#using)  
[Extending Selection](#extending)  
[Events](#events)

<a name="using"></a>
## Using Selection

A widget extending `delite/Selection` can choose several selection modes through the `selectionMode` property:

* `"multiple"` which means the application user can select interactively several items at the time
* `"single"` which means the application user can only select interactively a single item at the time, this is the default.
* `"radio"` which means the application user can only select interactively a single item at the time. Once an item has
  been selected, interactively selecting another item deselects the previously selected item, and the user 
  cannot deselect the selected item. 
* `"none"` which means the application user can not interactively select an item

Note that this mode does not impact selection by the `selectedItem(s)` APIs which are always available and always allow 
several items to be selected. If you want to restrict selection by those APIs you have to make sure code calling the 
selection method is doing that accordingly to the `selectionMode` or to specialize `delite/Selection` for that purpose.

Once a selection mode has been set there are three ways to modify the selection on the instance:
 
* setting the `selectedItem` property to an item to select it and only it
* setting the `selectedItems` to an array of items to select all those items and on only them
* use the `setSelected()` function to toggle on or off the selection state of a particular item

You can know the selection state by querying either:

* the `selectedItem` property to get the last selected item
* the `selectedItems` property to get all the selected items

<a name="extending"></a>
## Extending Selection

In order for a widget to leverage `delite/Selection` it must extend it and implement the `getIdentity()`
method as follows:

```js
require([
	"delite/register",
	"delite/Selection",
	"delite/StoreMap"
	/*, ...*/
], function (
	register,
	Selection,
	StoreMap
	/*, ...*/
) {
	return register("my-widget", [HTMElement, Selection, StoreMap], {
		labelAttr: "label",
		refreshRendering: function (props) {
			if ("renderItems" in props) {
				// render item has changed, do something to reflect that in the rendering
				this.innerHTML = "";
				this._childHash = {};
				for (var i = 0; i < this.renderItems.length; i++) {
					let child = this.ownerDocument.createElement("div");
					child.innerText = this.renderItems[i].label;
					this._childHash[this.renderItems[i].id] = child;
					this.appendChild(child);
				}
			}
			if ("selectedItems" in props) {
				for (var j = 0; j < this.selectedItems.length; j++) {
					let child = this._childHash[this.getIdentity(items[j])];
					let selected = this.isSelected(items[j]);
					child.classList.toggle("selected", selected);
				}
			}

		},
		getIdentity: function (item) {
			return this.source.getIdentity(item);
		}
	});
});
```

The `getIdentity()` function is in charge of returning a unique identifier for an item to be selected.

If the widget provides a user interaction that leads to select some items, the implementation should call the
`selectFromEvent()` function in order to update the selection and propagate the notification accordingly.

```js
require(["delite/register", "delite/Selection", "delite/StoreMap"/*, ...*/], 
  function (register, Widget, Selection/*, ...*/) {
  return register("my-widget", [HTMElement, Selection, StoreMap], {
    clickHandler: function (event) {
      // get the DOM Node and the corresponding item at the place where the click event occured
      /* var renderer = ...; var item = ... */ 
      this.selectFromEvent(event, item, renderer, true);
    }
  });
});
```

Optionally, the subclass can redefine the `hasSelectionModifier()` function to change the pattern that triggers single
and multiple selection in `selectFromEvent()`.

<a name="events"></a>
## Events

The `delite/Selection` class provides the following events:

|event name|dispatched|cancelable|bubbles|properties|
|----------|----------|----------|-------|----------|
|selection-change|after selection has been modified trough user interaction|No|No|<ul><li>`oldValue`: the old selected item</li><li>`newValue`: the new selected item</li><li>`renderer`: the DOM node on which the selection action occurred</li><li>`triggerEvent`: the event that lead to the selection event</li></ul>|
