var DocumentDBClient = require('documentdb').DocumentClient;
var async = require('async');

function TaskList(taskDao, insightsClient) {
  this.taskDao = taskDao;
  this.insightsClient = insightsClient;
}

TaskList.prototype = {
  showTasks: function(req, res) {
    var self = this;

    var querySpec = {
      query: 'SELECT * FROM root r WHERE r.completed=@completed',
      parameters: [{
        name: '@completed',
        value: false
      }]
    };

    self.insightsClient.trackEvent('Showing Tasks');
    var startDate = new Date();

    self.taskDao.find(querySpec, function(err, items) {
      if (err) {
        throw (err);
      }

      var endDate = new Date();
      var duration = endDate - startDate;
      self.insightsClient.trackMetric("Loaded Tasks", duration);

      res.render('index', {
        title: 'My ToDo List ',
        tasks: items
      });
    });
  },

  addTask: function(req, res) {
    var self = this;
    var item = req.body;

    self.insightsClient.trackEvent('Adding Task', {category: item.category});

    var startDate = new Date();

    self.taskDao.addItem(item, function(err) {
      if (err) {
        throw (err);
      }
      
      var endDate = new Date();
      var duration = endDate - startDate;
      self.insightsClient.trackMetric("Added Task", duration);

      res.redirect('/');
    });
  },

  completeTask: function(req, res) {
    var self = this;
    var completedTasks = Object.keys(req.body);

    self.insightsClient.trackEvent('Completing Task');

    async.forEach(completedTasks, function taskIterator(completedTask, callback) {
      self.taskDao.updateItem(completedTask, function(err) {
        if (err) {
          callback(err);
        } else {
          callback(null);
        }
      });
    }, function goHome(err) {
      if (err) {
        throw err;
      } else {
        res.redirect('/');
      }
    });
  }
};

module.exports = TaskList;
