
Meteor.startup(function() {
  var canModify = function(userId, items) {
    return _.all(items, function(item) {
      return !item.privateTo || item.privateTo === userId;
    });
  };

  Habits.allow({
    insert: function () { return true; },
    update: canModify,
    remove: canModify,
    fetch: ['privateTo']
  });

  Lists.allow({
    insert: function () { return true; },
    update: canModify,
    remove: canModify,
    fetch: ['privateTo']
  });
});
