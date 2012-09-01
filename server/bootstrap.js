// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
	Meteor.methods({
	  	updateHabits : function() {

			console.log('start');

			  var list_id = Session.get('list_id');
			  if (!list_id)
				var sel = {};
			  else
				var sel = {list_id: list_id};
			  var tag_filter = Session.get('tag_filter');
			  if (tag_filter)
			    sel.tags = tag_filter;

				console.log('start1');

			var today = new Date().removeHours().getTime();

			  //checking if list hasn't been updated since yesterday
			  //there has got to be a better way to do this!
			  if (Habits.findOne(sel)) {		
				console.log(Habits.findOne({}, {sort: {timestamp:-1}}));
				var prevTime = Habits.findOne(sel,{sort: {timestamp: 1}}).timestamp;
				console.log('check1');
					console.log(prevTime);
				console.log(today);
				//if a habit was done previously, i grab that time and add it to the history then reset it!
				if (prevTime < today) {	
						console.log('check2');
					_.each(Habits.find(sel).fetch(), function(habit) {

						Habits.update(sel, { $set : {done: false, timestamp:null}});

					});
				}
			  }

			console.log('done');
			return '';
		}
	});
	
	
  if (Lists.find().count() === 0) {
    var data = [
      /*{name: "Meteor Principles",
       contents: [
         ["Data on the Wire", "Simplicity", "Better UX", "Fun"],
         ["One Language", "Simplicity", "Fun"],
         ["Database Everywhere", "Simplicity"],
         ["Latency Compensation", "Better UX"],
         ["Full Stack Reactivity", "Better UX", "Fun"],
         ["Embrace the Ecosystem", "Fun"],
         ["Simplicity Equals Productivity", "Simplicity", "Fun"]
       ]
      },
      {name: "Languages",
       contents: [
         ["Lisp", "GC"],
         ["C", "Linked"],
         ["C++", "Objects", "Linked"],
         ["Python", "GC", "Objects"],
         ["Ruby", "GC", "Objects"],
         ["JavaScript", "GC", "Objects"],
         ["Scala", "GC", "Objects"],
         ["Erlang", "GC"],
         ["6502 Assembly", "Linked"]
         ]
      },*/
      {name: "Joe's Habits",
       contents: [
			{
				text : "Morning Walk",
				tags : ["recovery",
			      "relaxation"],
				history : [1345791600000,
				      1345705200000,
				      1345532400000
				   	]
			},
			{
				text : "Exercise",
				tags : ["health",
			      "exercise"],
				history : [1345791600000,
			      1345705200000,
			      1345618800000,
			      1345446000000]
			},
			{
				text : "Brush & Floss (Morning)",
				tags : ["teeth", "health"],
				history : [1345791600000,
				      1345705200000,
				      1345618800000,
				      1345532400000]
			},
			{
				text :"Brush & Rinse (Evening)",
				tags : ["teeth",
				      "health"],
				history : [  1345791600000]
			},
			{
				text : "Drink Water",
				tags : ["health"],
				history : []
			},
			{
				text : "Foam Roll 15min",
				tags : ["exercise",
			      "recovery"],
				history : [ ]
			},
			{
				text : "Write 750 Words",
				tags : ["brain","writing"],
				history : [ 
			      1345964400000,
			      1345878000000,
			      1345705200000,
			      1345618800000,
			      1345446000000,
			      1345791600000,
			      1345532400000,
			      1345359600000,
			      ]
			}
       ]
      }
    ];
	
    var timestamp = (new Date()).getTime();
    for (var i = 0; i < data.length; i++) {
      var list_id = Lists.insert({name: data[i].name});
      for (var j = 0; j < data[i].contents.length; j++) {
        var info = data[i].contents[j];
        Habits.insert({list_id: list_id,
                      text: info.text,
                      created: timestamp,
                      tags: info.tags,
                      history: info.history});
        timestamp += 1; // ensure unique timestamp.
      }
    }
  }
});

