define(["dojo/_base/declare", "dojo/_base/lang", "dojo/Stateful", "dojo/when"],
	function(declare, lang, Stateful, when){

	return declare(Stateful, {

		// summary:
		//		This mixin contains the store management.

		// store: dojo.store.Store
		//		The store that contains the events to display.
		store: null,

		// query: Object
		//		A query that can be passed to when querying the store.
		query: {},

		// queryOptions: dojo/store/api/Store.QueryOptions?
		//		Options to be applied when querying the store.
		queryOptions: null,

		itemToRenderItem: function(item, store){
			// tags:
			//		protected
			return item;
		},

		_initItems: function(items){
			// tags:
			//		private
			this.set("items", items);
			return items;
		},

		_setStoreAttr: function(value){
			// tags:
			//		private
			var r;
			if(this._observeHandler){
				this._observeHandler.remove();
				this._observeHandler = null;
			}
			if(value != null){
				var results = value.query(this.query, this.queryOptions);
				if(results.observe){
					// user asked us to observe the store
					this._observeHandler = results.observe(lang.hitch(this, this._updateItem), true);
				}
				// if we have a mapping function between data item and some intermediary items use it
				results = results.map(lang.hitch(this, function(item){
					return this.itemToRenderItem(item, value);
				}));
				r = when(results, lang.hitch(this, this._initItems));
			}else{
				r = this._initItems([]);
			}
			this._set("store", value);
			return r;
		},

		_updateItem: function(object, previousIndex, newIndex){
			// tags:
			//		private

			var items = this.get("items");

			// if we have a mapping function between data item and some intermediary items use it
			var newItem = this.itemToRenderItem(object, this.store);

			if(previousIndex != -1){
				// this is a remove or a move
				if(newIndex != previousIndex){
					// remove
					this.removeItem(previousIndex, newItem, items);
				}else{
					// this is a put, previous and new index identical
					this.putItem(previousIndex, newIndex, newItem, items);
				}
			}else if(newIndex != -1){
				// this is a add
				this.addItem(newIndex, newItem, items);

			}
			// set back the modified items property
			this.set("items", items);
		},

		removeItem: function(index, item, items){
			// tags:
			//		protected
			items.splice(index, 1);
		},

		putItem: function(previousIndex, newIndex, item, items){
			// tags:
			//		protected
			// we want to keep the same item object and mixin new values
			// into old object
			lang.mixin(items[previousIndex], item);
		},

		addItem: function(index, item, items){
			// tags:
			//		protected
			items.splice(index, 0, item);
		}
	});
});
