// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Users = new Meteor.Collection("users");
Habits = new Meteor.Collection("habits");

// ID of currently selected user
Session.set('user_id', null);

// Name of currently selected tag for filtering
Session.set('tag_filter', null);

// When adding tag to a habit, ID of the habit
Session.set('editing_addtag', null);
// When adding date to a habit, ID of the habit
Session.set('editing_date', null);

// When editing a user name, ID of the user
Session.set('editing_username', null);

// When editing habit text, ID of the habit
Session.set('editing_itemname', null);


// Subscribe to 'users' collection on startup.
// Select a user once data has arrived.
Meteor.subscribe('users', function () {
  if (!Session.get('user_id')) {
    var user = Users.findOne({}, {sort: {name: 1}});
    if (user)
      Router.setUser(user._id);
  }
});

// Always be subscribed to the habits for the selected user.
Meteor.autosubscribe(function () {
  var user_id = Session.get('user_id');
  if (user_id)
    Meteor.subscribe('habits', user_id);
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
////////// Users //////////

Template.users.users = function () {
  return Users.find({}, {sort: {name: 1}});
};

Template.users.events = {
  'mousedown .user': function (evt) { // select user
    Router.setUser(this._id);
  },
  'click .user': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'dblclick .user': function (evt) { // start editing user name
    Session.set('editing_username', this._id);
    Meteor.flush(); // force DOM redraw, so we can focus the edit field
    focus_field_by_id("user-name-input");
  }
};

Template.users.events[ okcancel_events('#user-name-input') ] =
  make_okcancel_handler({
    ok: function (value) {
      Users.update(this._id, {$set: {name: value}});
      Session.set('editing_username', null);
    },
    cancel: function () {
      Session.set('editing_username', null);
    }
  });

// Attach events to keydown, keyup, and blur on "New user" input box.
Template.users.events[ okcancel_events('#new-user') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      var id = Users.insert({name: text});
      Router.setUser(id);
      evt.target.value = "";
    }
  });

Template.users.selected = function () {
  return Session.equals('user_id', this._id) ? 'selected' : '';
};

Template.users.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.users.editing = function () {
  return Session.equals('editing_username', this._id);
};

////////// Habits //////////

Template.habits.any_user_selected = function () {
  return !Session.equals('user_id', null);
};

Template.habits.events = {};

Template.habits.events[ okcancel_events('#new-habit') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      var tag = Session.get('tag_filter');
      Habits.insert({
        text: text,
        user_id: Session.get('user_id'),
        done: false,
        created: (new Date().getTime()),
        timestamp: null,
        tags: tag ? [tag] : [],
        history: [],
		streak: 0
      });
      evt.target.value = '';
    }
  });

Template.habits.habits = function () {
  // Determine which habits to display in main pane,
  // selected based on user_id and tag_filter.

  var user_id = Session.get('user_id');
  if (!user_id)
    return {};

  var sel = {user_id: user_id};
  var tag_filter = Session.get('tag_filter');
  if (tag_filter)
    sel.tags = tag_filter;
  
  var today = new Date().removeHours().getTime();

  //checking if list hasn't been updated since yesterday
  //there has got to be a better way to do this!
  if (Habits.findOne(sel)) {	
	  var prevTime = Habits.findOne(sel,{sort: {timestamp: -1}}).timestamp;	
	  
	  //if a habit was done previously, i grab that time and add it to the history then reset it!
	  if (prevTime != today && prevTime != '') {	
		 _.each(Habits._collection.docs, function(habit) {
			if (habit.done)
				habit.history.push(prevTime);			
			habit.done = false;
			habit.timestamp = null;
		});
	  }
  }

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

Template.habit_item.done_checkbox = function () {
  return this.done ? 'checked="checked"' : '';
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
  'click .check': function () {
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
		     $set: {timestamp: today, done: !this.done}}
		); 
	}
	
  },
  'click .destroy': function () {	
	Session.get('calendar').markDates(this._id, this.history, true);
    Habits.remove(this._id);
  },

  'click .addtag': function (evt) {
    Session.set('editing_addtag', this._id);
    Meteor.flush(); // update DOM before focus
    focus_field_by_id("edittag-input");
  },
  'click .display .habit-text': function (evt) {
	    Session.set('editing_date', this._id);
	    Meteor.flush(); // update DOM before focus
	    focus_field_by_id("date-input");
  },

  'dblclick .display .habit-text': function (evt) {
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
      Habits.update({_id: id}, {$pull: {tags: tag}});
    }, 300);
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

// Pick out the unique tags from all habits in current user.
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Habits.find({user_id: Session.get('user_id')}).forEach(function (habit) {
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
	  Habits.find({user_id: Session.get('user_id')}).forEach(function (habit) {
	  	Session.get('calendar').markDates(habit._id, habit.history);
	  });
	} else {
		
		Habits.find({user_id: Session.get('user_id')}).forEach(function (habit) {
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

////////// Tracking selected user in URL //////////

var HabitsRouter = Backbone.Router.extend({
  routes: {
    ":user_id": "main"
  },
  main: function (user_id) {
    Session.set("user_id", user_id);
    Session.set("tag_filter", null);
  },
  setUser: function (user_id) {
    this.navigate(user_id, true);
  }
});

Router = new HabitsRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});
		
/*
  Template.entry.events = {
    'click button#status': function(evt) {
	    $target = $(evt.target);
	    tarValue = evt.target.value
		var states = [{
				class: 'btn btn-mini btn-success success',
				value: true,
				text: 'Habit Done!'
			},
			{
				class: 'btn btn-mini btn-warning success',
				value: null,
				text: 'Not Done'
			}];
		
		if (tarValue === 'true') {	
			var myState = states[1];
			setState(myState);
		} else {	
			var myState = states[0];
			setState(myState);
		}
		
		
		function setState(state) {
			evt.target.value = state.value;
			$target.attr("class", state.class);
			$target.html(state.text);
		}
		return;
    }
  };
	
  Template.entry.events[okcancel_events('input')] = make_okcancel_handler({
    	ok: function(event) {
			Form.submit(event);
		}
  });
	
  Template.habits.habits = function () {
	
	var habits = Habits.find({}, {sort: {date: -1} });
	var count = 0, habitDisplay = [];
	
	habits.forEach(function (habit) {
	  habitDisplay.push({name: habit.name, notes: habit.notes, date: habit.date, status: habit.status});
	  count += 1;
	});
	
	return habitDisplay;
  };

  Template.entry.today = function() {
	    var d = new Date().formatDate();
		return d;
  };

 */




/*
Form = {
	submit :  function (event) {
		var $nameEntry = $('#name');
		var dateEntry = $('#date').val();
		var $notesEntry = $('#notes');
		var statusEntry = $('#status').val();
		if ($nameEntry.val() != '') {
			var ts = new Date();	
			if (dateEntry === '') {
				dateEntry = ts.formatDate();
			}
			Habits.insert({name: $nameEntry.val(), status: statusEntry, notes: $notesEntry.val(), date: dateEntry, timeStamp: ts});
			$nameEntry.className = "";
			this.clear([$('#date'), $nameEntry, $notesEntry]);
		} else {
			console.log('fail');
			$nameEntry.addClass("required");
		}
	},
	clear : function(elements) {
		_.each(elements, function (element) {
			element.val('');
	  	});
	}
};

*/




