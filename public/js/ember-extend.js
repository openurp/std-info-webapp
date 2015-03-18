Ember.Store = Ember.Object.extend({
	// var name = route.entityName;
	host : 'http://192.168.103.24:8080/edu-base-ds/default/',
	route: null,
	entityName : function(){
		return this.get('route').get('entityName');
	}.property('route'),
	find : function(a, b){
    // console.log('Store.find', this.get('route').controller);
		var name = this.get('entityName'), route = this.get('route');
		if(typeof(a) != 'object'){
			return this.findById(a, b);
		}
    var opts = a, controller = route.controller;
    if(controller){
      var searchField = Ember.getParamObject(controller.get('searchField'));
      Ember.$.extend(opts, searchField);
      controller.set('model', []);
    }
		var url = this.get('host') + name + '.json';
		if(route.select) opts.select = route.select;
		return Ember.$.getJSON(url, opts).then(function(data){
      if(typeof(b) == 'function'){
        b(data);
      }
      route.set('data', data);
			return data.items;
		});
	},
	// return Ember.$.getJSON("http://192.168.103.24:8080/code-ds/person/nations/"+params.nation_id+".json");
	findById : function(id, opts){
		var name = this.get('entityName');
		var url = this.get('host') + name + '/' + id + '.json';
		return Ember.$.getJSON(url);
	},

	save : function(model){
		var name = this.get('entityName');
		var url = this.get('host') + name;
		if(model.id){
			url += '/' + model.id
		}
		url += '?_method=PUT'
		return Ember.$.post(url, {'data': JSON.stringify(model)});
	}
});

Ember.EntityRoute = Ember.Route.extend({
	beforeModel : function(){
		this.store = Ember.Store.create({route: this});
	},
	setupController : function(controller, model){
		controller.set('store', this.get('store'));
		//调用父类方法
		this._super(controller, model);
	},
	model : function (params){
    // console.log('params', params, this.store);
    if(params.id){
    	return this.store.find(params.id);
    }
		return this.store.find(params);
	}
});
Ember.PageRoute = Ember.EntityRoute.extend({
	setupController: function(controller, model) {
    controller.set('routeName', this.routeName);
    controller.setData(this.get('data'));
    this._super(controller, model);
  }
});

Ember.PageController = Ember.ArrayController.extend({
  searchField: {},
	pageIndex: 1,
	isSelectAll: false,
  setData : function(data){
    console.log('setData');
    this.set('pageIndex', data.pageIndex);
    this.set('pageSize', data.pageSize);
    this.set('totalItems', data.totalItems);
    this.set('model', data.items);
  },
	pageLast: function(){
		return Math.ceil(this.totalItems * 1.0 / this.pageSize);
	}.property('pageSize', 'totalItems'),
	isPageFirst: function(){
		return this.pageIndex == 1;
	}.property('pageIndex'),
	pagePrev: function(){
		return this.pageIndex == 1 ? 1 : this.pageIndex - 1;
	}.property('pageIndex'),
	pageNext: function(){
		return this.get('pageLast') == this.pageIndex ? this.pageIndex : this.pageIndex + 1;
	}.property('pageIndex'),
	isPageLast: function(){
		// console.log('isPageLast',this.get('pageLast'), this.pageIndex)
		return this.get('pageLast') == this.pageIndex;
	}.property('pageLast', 'pageIndex'),
	pageIndexs : function(){
		var list = [];
		var start = this.pageIndex - 2, end = this.pageIndex + 2;
		var index = this.pageIndex;		
		for(var i = start; i <= this.get('pageLast') && list.length < 5; i++){
			if(i > 0){
				list.push(i);
			}
		}
		// console.log(list)
		return list;
	}.property('pageIndex','pageSize','totalItems'),
  allAreSelect: function (key, value) {
  	// console.log('allAreSelect', key, value);
    if (arguments.length === 2) {
      this.setEach('isSelect', value);
      return value;
    }else{
    	var value = true;
    	this.forEach(function(m){
    		value = value && m.isSelect;
    	});
    	return value;
    }
  }.property('@each.isSelect'),
  isSelectOne : function(){
  	return this.get('selectNum') == 1;
  }.property('selectNum'),
  isSelect : function(){
  	return this.get('selectNum') > 0;
  }.property('selectNum'),
  selectNum : function(){
		var num = 0;
  	this.forEach(function(m){
  		if(m.isSelect) num ++;
  	});
  	return num;
  }.property('@each.isSelect'),
	actions :{
		selectAll : function(){
			var isSelect = this.isSelectAll = !this.isSelectAll;
			this.get('model').forEach(function(m){
				m.isSelect = isSelect;
			});
		},
		add : function(){
			this.transitionToRoute(this.routeName.substring(0, this.routeName.indexOf('.') + 1) + 'edit');
		},
    edit : function (){
      var ids = this.getSelectIds();
    },
    remove : function(){

    },
    search : function(){
      if(this.get('pageIndex') != 1){
        this.transitionToRoute(this.routeName, 1, this.get('pageSize'));
      }else{
        var ctl = this;
        this.store.find({pageIndex:1, pageSize: this.get('pageSize')}, function(data){
          ctl.setData(data);
        });
      }
    }
	}
});

Ember.LinkView.reopen({
  attributeBindings : ['aria-label']
});

Ember.getParamObject = function (obj){
  var newObj = {};
  for(name in obj){
    if(!obj.hasOwnProperty(name)) continue; 
    newObj[Ember.getDotName(name)] = obj[name];
  }
  return newObj;
}
Ember.getDotName = function(name){
  var reg = /([A-Z])\1/;
  var arr;
  while((arr = reg.exec(name)) != null){
    name = name.replace(arr[0], '.' + arr[1].toLowerCase());
  }
  return name;
}