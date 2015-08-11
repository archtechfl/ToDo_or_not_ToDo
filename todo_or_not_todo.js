Tasks =  new Mongo.Collection("tasks");

if (Meteor.isClient) {

  Meteor.subscribe("tasks");

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
      Meteor.call("addTask", text);
 
      // Clear form
      event.target.text.value = "";
    },
    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }
  });

  // Determine if owner
  Template.task.helpers({
    // Owner is defined when the task is created, set to the user ID that created it
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });

  // Task template events
  Template.task.events({
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    },
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

} // End of client only code

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    Meteor.publish("tasks", function () {
      return Tasks.find({
        $or: [
          { private: {$ne: true} },
          { owner: this.userId }
        ]
      });
    });
  });
}

Meteor.methods({
  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
 
    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },
  deleteTask: function (taskId) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.remove(taskId);
  },
  setChecked: function (taskId, setChecked) {
    Tasks.update(taskId, { $set: { checked: setChecked} });
  },
  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);
    // Only owner can set to private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    // Update privacy on task
    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
});

// End of server code
