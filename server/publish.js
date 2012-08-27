// Lists -- {name: String}
Lists = new Meteor.Collection("lists");

// Publish complete set of lists to all clients.
Meteor.publish('lists', function () {
  return Lists.find();
});


// Habits -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           list_id: String,	
//           timestamp: Number,
//           history: [timestamp:Number,...}
Habits = new Meteor.Collection("habits");

// Publish all items for requested list_id.
Meteor.publish('habits', function (list_id) {
	return Habits.find({
		list_id: list_id,
		privateTo: {
			$in: [null, this.userId()]
		}
	});
});
