// if the database is empty on server start, create some sample data.
Meteor.startup(function () {
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

