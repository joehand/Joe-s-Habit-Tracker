
/* calendar.js	*/



	/*SET all the Session variables as null. */
	/*Used to bind data to template*/
	
Session.set('calendar', null);
Session.set('year', null);
Session.set('month', null);
Session.set('weeks', null);
Session.set('time', null);



	/*Stuff to run on startup*/
	/*Creates a new calendar and sets session vars, starts clock*/

Meteor.startup(function () {
	//ask server to update habits to today
	Meteor.call('updateHabits');
	
	var cal = new Calendar();
	Session.set('calendar', cal);
	Session.set('year', cal.year());
	Session.set('month', cal.month());
	Session.set('time', cal.now.formatTime());
	Meteor.setInterval(cal.clockUpdate, 30000);
});



	/*CALENDAR Templates*/
	/*Bind Session data to html template*/

	/*Calendar Div ID = timestamp (changes w/ month & year)*/
Template.calendar.ts = function() {
	return new Date().getTime() || Session.get('calendar').calDate.getTime() ;
};


	/*Calendar year display*/
Template.calendar.year = function() {
	return Session.get('year') || new Calendar().year();
};

	/*Calendar month display and next/previous buttons (Object passed to template)*/
Template.calendar.month = function() {	  
	var cal = Session.get('calendar') || new Calendar(),
		next = cal.nextMonthName(cal).nextMonth,
		prev = cal.previousMonth().prevMonth;
		
	var month = {
					current: cal.month(),
					prev: prev,
					next: next
	}
	return month;
};

	/*Calendar weeks, determines number of rows*/
Template.calendar.weeks = function() {
    return Session.get('weeks') || new Calendar().weeks();
};

	/*Calendar days*/
Template.calendar.days = function() {
	  return new Calendar().days;
 };

	/*Calendar live clock*/
Template.calendar.time = function() {
   return Session.get('time') || new Date().formatTime();
};

	/********EVENTS*******/
	/* NEXT & PREV month buttons*/
	/* Click time => Current month*/
Template.calendar.events = {
	'click .next': function (evt) {
      var cal = null;
    Session.get('calendar') ? cal = Session.get('calendar') : cal = new Calendar();
	cal = cal.nextMonthName(cal);
		cal.updateCalendar();

  },
 	'click .previous': function (evt) {
    var cal = null;
    Session.get('calendar') ? cal = Session.get('calendar') : cal = new Calendar();
	cal = cal.previousMonth(true);	

  }	,
 'click .time': function (evt) {
    var cal = null;
    Session.get('calendar') ? cal = Session.get('calendar') : cal = new Calendar();
	cal = cal.currentMonth(true);
  }

 };

	/********Calendar Object*******/
	/* Starts with a date or by default Current Month*/

var Calendar = function(calDate) {
	this.now = new Date();
	if (calDate && checkCurrent(this.now, calDate)) {
		this.calDate = calDate;
		this.current = false;
	} else {
		this.calDate = this.now;
		this.current = true;
	}
	
	this.el = $('.content').find('*[data-ts="' + this.calDate.getTime() + '"]');	
	
	function checkCurrent(now, checkDate) {
	  now.getMonth() + '' + now.getYear() === checkDate.getMonth() + '' + checkDate.getYear() ? check = false: check = true;
	  return check;
	}
	
	return this;
};


	/********Calendar Prototype*******/
	/* Functions to get all the necessary display output */

Calendar.prototype =  {
	year: function() {return this.calDate.getFullYear();},
	month: function() {return this.calDate.monthName();},
	time: function() { return this.now.formatTime();},
	days: [ "Sunday" ,"Monday" ,"Tuesday" ,"Wednesday" ,"Thursday" ,"Friday","Saturday"],
	numWeeks: function() {return this.calDate.countWeeksOfMonth();},
	/*Creates an array of weeks ready to pass to template*/
	weeks: function(numWeeks) {
		var weekArray = [], 
			cal = this, date = 0;
			
		for (var i=0; i < cal.numWeeks(); ++i) {	
			var dateArray = []	
			_.each(cal.days, function(day) {
				dateArray.push('');
			});
			weekArray.push({index:i, dates: dateArray});
		};
		
		_.each(weekArray, function(week, i) {
			if (i != 0) 
				date = weekArray[i-1].dates[6].date;
			weekArray[i].dates = cal.dates(date, week, i);
		});
		return weekArray;
		
	},
	/*Creates an array of date objects for html*/
	dates: function(date, week, i) {
		var dates = week.dates,
			cal = this,
			calDate = this.calDate,
			current = this.current,
			now = this.now;	
		_.each(dates, function(day, j) {
			if ((i === 0 && j < calDate.firstOfMonth()) || date >= calDate.daysInMonth()) {
				dates[j] = {date:'', elClass:'', id:'', ts: ''};
			} else{
				date += 1;
				dates[j] = {
						date:date, 
						elClass:'day ', 
						id: (calDate.getMonth() + 1) + '-' + date + '-' + calDate.getFullYear(), 
						dayts: new Date(calDate.getFullYear(),  calDate.getMonth(), date).removeHours().getTime()
					};
				
				if (j === 0 || j === 6)
					dates[j].elClass += ' weekend';
					
				if (parseInt(now.getDate()) === parseInt(date) && current) {
					dates[j].elClass += ' today';
				}
				
			}
		});	
		
		return dates;
	},
	/*Find/Go to previous month. Update = true => Calendar update to new month*/
	previousMonth: function(update) {
		var oldCal = this, newMonth, newYear, cal, oldMonth = oldCal.calDate.getMonth();
		
		if (oldMonth ===0) {
			newMonth = 11;
			newYear = oldCal.year() - 1;
		} else {
			newMonth = oldMonth - 1;
			newYear = oldCal.year();
		}
		
		var newDate = new Date(newYear, newMonth, 1)
		cal = new Calendar (newDate);

		cal.prevMonth = newDate.monthName();
			if (update)
				cal.updateCalendar();
		return cal;
	},
	/*Find/Go to next month. Update = true => Calendar update to new month*/
	nextMonthName: function(oldCal) {
		var newMonth, newYear, cal, oldMonth = oldCal.calDate.getMonth();
		
		if (oldMonth ===11) {
			newMonth = 0;
			newYear = oldCal.year() + 1;
		} else {
			newMonth = oldMonth + 1;
			newYear = oldCal.year();
		}
		
		var newDate = new Date(newYear, newMonth, 1)
		cal = new Calendar (newDate);
		
		cal.nextMonth = newDate.monthName();
		return cal;
	},
	currentMonth: function(update) {
		var cal = new Calendar();
		if (update)
			cal.updateCalendar();
		return cal;
	},
	/*Refreshes session data based on new cal data, will update templates*/
	updateCalendar: function() {
		Session.set('calendar', this); 
	  	Session.set('year', this.year());
	  	Session.set('month', this.month());
	  	Session.set('weeks', this.weeks());
		
		
	},
	markDates: function(habit_id, dates, removeAll) {
		//takes a dates array and adds checkboxes and a class for the whole date.
		//dates = [timestamp1, timestamp2, ..], removeAll true => delete habit
		var html = '<i data-id="' + habit_id + '" class="icon-ok"></i>';
		
		var $checkMarks = $('#calendar').find('*[data-id="' + habit_id + '"]');
		$checkMarks.parent().removeClass('completed');
		$checkMarks.remove();
		
		_.each(dates, function(date) {
			  var ts = new Date(date).removeHours().getTime();
			  var $el = $('*[data-ts="' + ts + '"]');
			
			  if (!removeAll) {		
				  $el
					.addClass('completed')
					.append(html);
					
			  } else {
				  $el
			      	.find('*[data-ts="' + habit_id + '"]').remove()
					.removeClass('completed');
		      }
		});
		
		
	},
	clockUpdate : function() {
		var time = new Date().formatTime();
		$('.time').html(time);
	},
	//firstTimestamp and secondTimestamp are passed as Timestamps not dates
	daysBetween : function (firstTimestamp, secondTimestamp) {
		var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
		var diffDays = Math.round(Math.abs((firstTimestamp - secondTimestamp)/(oneDay)));
		return diffDays;
	},
	
	//takes the history array and determines the streak of days in a row, from most recent
	streakCalc : function(history) {
		var oneDay = 24*60*60*1000; // hours*minutes*seconds*milliseconds
		
		var streak = '',
			yesterday = new Date().removeHours().getTime() - 24*60*60*1000,
			recentTimestamp = _.any(history, function(num) {return num >= yesterday; });//find item in array that is newer than yesterday (yesterday or today)
		
		if (recentTimestamp) {
		//should it just start the streak from today? i guess so. or yesterday. if today is in there that is fine, we will count that.
		//sort to make the most recent first in array
			var sortedHistory = _.sortBy(history, function(num){ return -num; });
		
		//find timestamp from today or yesterday. if the first timestamp is today or yesterday, streak is 0. 
		//if it is there, start calcualting. move back in the array one at a time and see if its 0 days between. if not, set the streak
		//if it is 0 days in between, set streak #, then compare the next two items in array. if zero, keep going.		
		
			var streakArray = _.reject(sortedHistory, function(num, index) {
				if (index === 0 )
					return false; //one day automatic streak!
				else
					return this.daysBetween(num, sortedHistory[0]) === index + 1; //returns values in array if index + 1 days since start of streak				
			}, Session.get('calendar'));
			
			streak = streakArray.length;
		}
		
		return streak;
		
		
		
	},
	//streak creator for making a history array if a user want to input a streak
	streakCreator : function(habitName, streakDays, startDate, tag) {
		var oneDay = 24*60*60*1000, // hours*minutes*seconds*milliseconds
			historyArray = [];
			
		if (!startDate)
			startDate = new Date().getTime();
		else
			startDate = new Date(startDate).getTime();
			
		for (var i=1; i<streakDays; ++i ) {
			historyArray.push(startDate - oneDay * i);
		}	
		
		if (Meteor.user() !== null)	{
	      
			 Habits.insert({
		        text: habitName,
		        list_id: Session.get('list_id'),
		        done: false,
		        created: (new Date().getTime()),
		        timestamp: null,
		        tags: tag ? [tag] : [],
		        history: historyArray,
				privateTo: Meteor.user()._id
		      });

		  }  else {
		      
			 Habits.insert({
		        text: habitName,
		        list_id: Session.get('list_id'),
		        done: false,
		        created: (new Date().getTime()),
		        timestamp: null,
		        tags: tag ? [tag] : [],
		        history: historyArray
		      });
		}
			
			
		return historyArray;	
	}
};