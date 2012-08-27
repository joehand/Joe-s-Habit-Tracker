// Users -- {name: String}
Users = new Meteor.Collection("users");

// Publish complete set of users to all clients.
Meteor.publish('users', function () {
  return Users.find();
});


// Habits -- {text: String,
//           done: Boolean,
//           tags: [String, ...],
//           user_id: String,	
//           timestamp: Number,
//           history: [timestamp:Number,...}
Habits = new Meteor.Collection("habits");

// Publish all items for requested user_id.
Meteor.publish('habits', function (user_id) {
  return Habits.find({user_id: user_id});
});
