Tasks =  new Mongo.Collection("tasks");

if (Meteor.isClient) {

  Template.body.helpers({
    tasks: function () {
      /* Uses hideCompleted Session variable to control appearance of list items */
      if (Session.get("hideCompleted")) {
        // $ne: MongoDB flag, not equals
        return Tasks.find({checked: {$ne: true}},{sort:{createdAt: -1}});
      } else {
        return Tasks.find({},{sort:{createdAt: -1}});
      }
    },
    // This method is called in the template, and sets the value of "checked" in the hideCompleted
    // checkbox
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
    // keep track of incompletes
    incompleteCount: function () {
      return Tasks.find({checked: {$ne: true}}).count();
    }
  });

  Template.body.events({
    "submit .new-task": function (event) {
      // Prevent default browser form submit
      event.preventDefault();
 
      // Get value from form element
      var text = event.target.text.value;
 
      // Insert a task into the collection
      Tasks.insert({
        text: text,
        createdAt: new Date(), // current time
        owner: Meteor.userId(),
        username: Meteor.user().username
      });
 
      // Clear form
      event.target.text.value = "";
    },
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  // Task template events
  Template.task.events({
    "click .toggle-checked": function () {
      // Set checked property to the opposite of its current value
        Tasks.update(this._id, {
          $set: {checked: ! this.checked}
        });
    },
    "click .delete": function () {
      Tasks.remove(this._id);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
