import Ember from 'ember';

export default Ember.View.extend({
  templateName : 'comm/edit/input',
  label:'',
  text:'',
  size: 12,
  labelClass : 'col-sm-4 control-label',
  textClass : 'col-sm-8',
  divclass : function (){
  	return 'col-md-' + this.size;
  }.property('size')
});
