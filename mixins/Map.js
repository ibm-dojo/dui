define(["dojo/_base/declare", "dojo/_base/lang", "dijit/mixins/Store"],
	function(declare, lang, Store){

	var getvalue = function(map, item, key, store){
		if(map[key+"Func"]){
			return map[key+"Func"](item, store);
		}else if(map[key+"Attr"]){
			return item[map[key+"Attr"]];
		}else{
			return item[key];
		}
	};

	var setvalue = function(map, item, key, store, value){
		if(map[key+"Func"]){
			map[key+"Func"](item, store, value);
		}else if(map[key+"Attr"]){
			item[map[key+"Attr"]] = value;
		}else{
			item[key] = value;
		}
	};

	return declare(Store, {

		// summary:
		//		Mixin for widgets for store binding management which extends dijit/mixins/Store.
		// description:
		//		For each mapped property "foo" one can provide:
		//			* fooAttr in which case the mapping is looking into the store item property specified by fooAttr
		//			* fooFunc in which case the mapping is delegating the mapping operation to the fooFunc property.
		//			  fooFunc is of the following signature (value must be passed only for set operations:
		//				fooFunc(item, store, value)
		//			* if none of this is provided the mapping is looking into store item "foo" property

		// mapAtInit: Boolean
		//		Whether the mapping occurs once when store items are loaded or on demand each time a property is accessed.
		// 		This can only makes an actual difference if you are using a binding function which behavior varies over time. Default is true.
		mapAtInit: true,

		// mappedKeys: Array?
		//		Array of item keys to be considered for mapping. If null all the properties of the store item are used as keys.
		mappedKeys: null,

		renderItemToItem: function(/*Object*/ renderItem, /*dojo/store/api/Store*/ store){
			// summary:
			//		Create a store item based from the widget internal item. By default it returns the widget internal item itself.
			// renderItem: Object
			//		The render item.
			// store: dojo/store/api/Store
			//		The store.
			// returns: Object
			var item;
			if(this.mapAtInit){
				item = {};
				// sepecial id case
				item[store.idProperty] = renderItem.id;
				for(var key in renderItem){
					setvalue(this, item, key, store, renderItem[key]);
				}
			}else{
				// mapping has already been done onto the original item
				// just use it
				item = renderItem.__item;
			}
			return lang.mixin(store.get(renderItem[store.idProperty]), item);
		},

		itemToRenderItem: function(item, store){
			// summary:
			//		Returns the widget internal item for a given store item. By default it returns the store item itself.
			// item: Object
			//		The store item.
			// store: dojo/store/api/Store
			//		The store the item is coming from
			// tags:
			//		protected

			var renderItem = {};
			var mappedKeys = this.mappedKeys?this.mappedKeys:Object.keys(item);
			var self = this, key;

			if(!this.mapAtInit){
				Object.defineProperty(renderItem, "__item", {
					value: lang.clone(item),
					enumerable: false
				});
			}

			// special id case
			renderItem.id = store.getIdentity(item);
			// general case
			for(var i = 0; i < mappedKeys.length; i++){
				if(this.mapAtInit){
					renderItem[mappedKeys[i]] = getvalue(this, item, mappedKeys[i], store);
				}else{
					(function(key){
						Object.defineProperty(renderItem, key, {
							get: function(){ return getvalue(self, this.__item, key, store); },
		    				set: function(value){ setvalue(self, this.__item, key, store, value); }
						});
					})(mappedKeys[i]);
				}
			}

			return renderItem;
		}
	});
});
