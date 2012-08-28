// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Lists = new Meteor.Collection("lists");
Habits = new Meteor.Collection("habits");

// ID of currently selected list
Session.set('list_id', null);

// Name of currently selected tag for filtering
Session.set('tag_filter', null);

// When adding tag to a habit, ID of the habit
Session.set('editing_addtag', null);
// When adding date to a habit, ID of the habit
Session.set('editing_date', null);

// When editing a list name, ID of the list
Session.set('editing_listname', null);

// When editing habit text, ID of the habit
Session.set('editing_itemname', null);


// Subscribe to 'lists' collection on startup.
// Select a list once data has arrived.
Meteor.subscribe('lists', function () {
  if (!Session.get('list_id')) {
    var list = Lists.findOne({privateId:null}, {sort: {name: 1}});
    if (list)
      Router.setList(list._id);
  }
});

// Always be subscribed to the habits for the selected list.
Meteor.autosubscribe(function () {
  var list_id = Session.get('list_id');
  if (list_id)
    Meteor.subscribe('habits', list_id);
});


////////// Helpers for in-place editing //////////

// Returns an event_map key for attaching "ok/cancel" events to
// a text input (given by selector)
var okcancel_events = function (selector) {
  return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
};

// Creates an event handler for interpreting "escape", "return", and "blur"
// on a text field and calling "ok" or "cancel" callbacks.
var make_okcancel_handler = function (options) {
  var ok = options.ok || function () {};
  var cancel = options.cancel || function () {};

  return function (evt) {
    if (evt.type === "keydown" && evt.which === 27) {
      // escape = cancel
      cancel.call(this, evt);

    } else if (evt.type === "keyup" && evt.which === 13 ||
               evt.type === "focusout") {
      // blur/return/enter = ok/submit if non-empty
      var value = String(evt.target.value || "");
      if (value)
        ok.call(this, value, evt);
      else
        cancel.call(this, evt);
    }
  };
};

// Finds a text input in the DOM by id and focuses it.
var focus_field_by_id = function (id) {
  var input = document.getElementById(id);
  if (input) {
    input.focus();
    input.select();
  }
};

////////// Lists //////////

Template.lists.lists = function () {
  return Lists.find({}, {sort: {name: 1}});
};

Template.lists.events = {
  'mousedown .list': function (evt) { // select list
    Router.setList(this._id);
  },
  'click .list': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'dblclick .list': function (evt) { // start editing list name
    Session.set('editing_listname', this._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    focus_field_by_id("list-name-input");
  }
};

Template.lists.events[ okcancel_events('#list-name-input') ] =
  make_okcancel_handler({
    ok: function (value) {
	console.log('ok!');
      Lists.update(this._id, {$set: 
				{name: value, privateTo: Meteor.user()._id}
			});
      Session.set('editing_listname', null);
    },
    cancel: function () {
      Session.set('editing_listname', null);
    }
  });

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.lists.events[ okcancel_events('#new-list') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      var id = Lists.insert({name: text});
      Router.setList(id);
      evt.target.value = "";
    }
  });

Template.lists.selected = function () {
  return Session.equals('list_id', this._id) ? 'selected' : '';
};

Template.lists.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.lists.editing = function () {
  return Session.equals('editing_listname', this._id);
};

////////// Habits //////////

Template.habits.any_list_selected = function () {
  return !Session.equals('list_id', null);
};

Template.habits.events = {};

Template.habits.events[ okcancel_events('#new-habit') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      var tag = Session.get('tag_filter');
      Habits.insert({
        text: text,
        list_id: Session.get('list_id'),
        done: false,
        created: (new Date().getTime()),
        timestamp: null,
        tags: tag ? [tag] : [],
        history: [],
		streak: 0,
		privateTo: Meteor.user()._id
      });
      evt.target.value = '';
    }
  });

Template.habits.habits = function () {
  // Determine which habits to display in main pane,
  // selected based on list_id and tag_filter.

  
  var user_id = Meteor.user();
  var list_id = Session.get('list_id');
  if (!list_id)
    return {};
  
  if (user_id)
  	var sel = {list_id: list_id, privateTo: Meteor.user()._id};
  else
	var sel = {list_id: list_id};
  var tag_filter = Session.get('tag_filter');
  if (tag_filter)
    sel.tags = tag_filter;
  	
  var today = new Date().removeHours().getTime();

  //checking if list hasn't been updated since yesterday
  //there has got to be a better way to do this!
  if (Habits.findOne(sel)) {	
	var prevTime = Habits.findOne(sel,{sort: {timestamp: -1}}).timestamp;

	//if a habit was done previously, i grab that time and add it to the history then reset it!
	if (prevTime != today && prevTime !== '') {	
		_.each(Habits.find({}).fetch(), function(habit) {
		if (habit.done)
			habit.history.push(prevTime);
		
		habit.done = false;
		habit.timestamp = null;
		});
	}
  }
  	
  console.log(Habits.find(sel, {sort: {done:1, text:1}}));
  return Habits.find(sel, {sort: {done:1, text:1}});
};


Template.habit_item.tag_objs = function () {
  var habit_id = this._id;
  return _.map(this.tags || [], function (tag) {
    return {habit_id: habit_id, tag: tag};
  });
};

Template.habit_item.done_class = function () {
  return this.done ? 'done' : '';
};

Template.habit_item.editing = function () {
  return Session.equals('editing_itemname', this._id);
};

Template.habit_item.adding_date = function () {
  Session.get('calendar').markDates(this._id, this.history);
  return Session.equals('editing_date', this._id);
};

Template.habit_item.adding_tag = function () {
  return Session.equals('editing_addtag', this._id);
};

Template.habit_item.events = {
	'click .destroy': function () {	
		Session.get('calendar').markDates(this._id, this.history, true);
		Habits.remove(this._id);
	},
	'click .addtag': function (evt) {
		Session.set('editing_addtag', this._id);
		Meteor.flush(); // update DOM before focus
		focus_field_by_id("edittag-input");
	},
	'click .display .check': function (evt) {
			var today = new Date().removeHours().getTime();	
			if (this.done) {
				//whoops, not done: remove from history;
				Habits.update(this._id,
					{
						$set: {timestamp: '', done: !this.done},
						$pull: {history:today}
					}
				);
			} else {
				//add to history;
				Habits.update(this._id, 
					{$addToSet: {history: today},
					$set: {timestamp: today, done: !this.done}
				}); 
			}
		/*	
		Session.set('editing_date', this._id);
		Meteor.flush(); // update DOM before focus
		focus_field_by_id("date-input");*/
	},
	'click .display .edit-icon': function (evt) {
		Session.set('editing_itemname', this._id);
		Meteor.flush(); // update DOM before focus
		focus_field_by_id("habit-input");
	},
	'click .remove': function (evt) {
		var tag = this.tag;
		var id = this.habit_id;

		evt.target.parentNode.style.opacity = 0;
		// wait for CSS animation to finish
		Meteor.setTimeout(function () {
			Habits.update(id, {$pull: {tags: tag}});
			}, 300);
	},
	'click .make-public': function () {
		Habits.update(this._id, {$set: {privateTo: null}});
	},	
	'click .make-private': function () {
		Habits.update(this._id, {$set: {	
			privateTo: Meteor.user()._id	
		}});
	}	
};


Template.habit_item.events[ okcancel_events('#habit-input') ] =
  make_okcancel_handler({
    ok: function (value) {
      Habits.update(this._id, {$set: {text: value}});
      Session.set('editing_itemname', null);
    },
    cancel: function () {
      Session.set('editing_itemname', null);
    }
  });

Template.habit_item.events[ okcancel_events('#edittag-input') ] =
  make_okcancel_handler({
    ok: function (value) {
      Habits.update(this._id, {$addToSet: {tags: value}});
      Session.set('editing_addtag', null);
    },
    cancel: function () {
      Session.set('editing_addtag', null);
    }
  });


Template.habit_item.events[ okcancel_events('#date-input') ] =
	make_okcancel_handler({
		ok: function (value) {
		var parts = value.match(/(\d+)/g);		
		var timestamp = new Date(parts[0], parts[1]-1, parts[2]).removeHours().getTime();
		Habits.update(this._id, {$addToSet: {history: timestamp}});
		Session.set('editing_date', null);
	},
		cancel: function () {
			Session.set('editing_date', null);
		}
	});

////////// Tag Filter //////////

// Pick out the unique tags from all habits in current list.
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Habits.find({list_id: Session.get('list_id')}).forEach(function (habit) {
    _.each(habit.tags, function (tag) {
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (! tag_info)
        tag_infos.push({tag: tag, count: 1});
      else
        tag_info.count++;
    });
    total_count++;
  });

  tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
  tag_infos.unshift({tag: null, count: total_count});

  return tag_infos;
};

Template.tag_filter.tag_text = function () {
  return this.tag || "All";
};

Template.tag_filter.selected = function () {
	
  return Session.equals('tag_filter', this.tag) ? 'selected' : '';
};

Template.tag_filter.events = {
	'mousedown .tag': function () {
		if (Session.equals('tag_filter', this.tag)) {
			Session.set('tag_filter', null);
			Habits.find({list_id: Session.get('list_id')}).forEach(function (habit) {
				Session.get('calendar').markDates(habit._id, habit.history);
			});
		} else {
			Habits.find({list_id: Session.get('list_id')}).forEach(function (habit) {
				if (_.include(habit.tags, Session.get('tag_filter'))) {
					Session.get('calendar').markDates(habit._id, habit.history);	
				} else {
					Session.get('calendar').markDates(habit._id, habit.history, true);
				}
			});
			Session.set('tag_filter', this.tag);
		}
	}
};

////////// Tracking selected list in URL //////////

var HabitsRouter = Backbone.Router.extend({
  routes: {
    ":list_id": "main",
	":user_id": "main"
  },
  main: function (list_id) {
    Session.set("list_id", list_id);
    Session.set("tag_filter", null);
  },
  setList: function (list_id) {
    this.navigate(list_id, true);
  }
});

Router = new HabitsRouter();

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});
		

