
// New Calendar	
Session.set('calendar', null);
Session.set('year', null);
Session.set('month', null);
Session.set('weeks', null);
Session.set('time', null);


if (Meteor.is_client) {
 /*CALENDAR Templates*/

	Meteor.startup(function () {
		var cal = new Calendar();
		Session.set('calendar', cal);
		Session.set('year', cal.year());
		Session.set('month', cal.month());
		Session.set('time', cal.now.formatTime());
		Meteor.setInterval(cal.clockUpdate, 30000);
	});

	Template.calendar.ts = function() {
		return new Date().getTime() || Session.get('calendar').calDate.getTime() ;
	};
	
	Template.calendar.year = function() {
		return Session.get('year') || new Calendar().year();
	};
	
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
	
	Template.calendar.weeks = function() {
	    return Session.get('weeks') || new Calendar().weeks();
	};
	
	Template.calendar.days = function() {
		  return new Calendar().days;
	 };
	
	Template.calendar.time = function() {
	   return Session.get('time') || new Date().formatTime();
	};
	
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
}



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

Calendar.prototype =  {
	year: function() {return this.calDate.getFullYear();},
	month: function() {return this.calDate.monthName();},
	time: function() { return this.now.formatTime();},
	days: [ "Sunday" ,"Monday" ,"Tuesday" ,"Wednesday" ,"Thursday" ,"Friday","Saturday"],
	numWeeks: function() {return this.calDate.countWeeksOfMonth();},
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
	dates: function(date, week, i) {
		var dates = week.dates,
			cal = this,
			calDate = this.calDate,
			current = this.current,
			now = this.now;	
		_.each(dates, function(day, j) {
			if ((i === 0 && j < calDate.firstOfMonth()) || date >= calDate.daysInMonth()) {
				dates[j] = {date:'', class:'', id:'', ts: ''};
			} else{
				date += 1;
				dates[j] = {
						date:date, 
						class:'day ', 
						id: (calDate.getMonth() + 1) + '-' + date + '-' + calDate.getFullYear(), 
						dayts: new Date(calDate.getFullYear(),  calDate.getMonth(), date).removeHours().getTime()
					};
				
				if (j === 0 || j === 6)
					dates[j].class += ' weekend';
					
				if (now.getDate() === date && current) {
					dates[j].class += ' today';
				}
				
			}
		});	
		
		return dates;
	},
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
	nextMonth: function(update) {		
		var oldCal = this, newMonth, newYear, cal, oldMonth = oldCal.calDate.getMonth();
		
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
		if (update)
			cal.updateCalendar();
		return cal;
	},
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
	updateCalendar: function() {
		Session.set('calendar', this); 
	  	Session.set('year', this.year());
	  	Session.set('month', this.month());
	  	Session.set('weeks', this.weeks());
		
		
	},
	markDates: function(habit_id, dates, removeAll) {
		//hmmm this cannot update when the calendar updates, only when dates are changed. needs to go both ways.
		//takes a dates array and adds checkboxes and a class for the whole date.
		//dates = [timestamp1, timestamp2, ..], add = true (add dates) or false (remove dates)
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
			      	.find('.icon-ok:last').remove()
					.removeClass('completed');
		      }
		});
		
		
	},
	clockUpdate : function() {
		var time = new Date().formatTime();
		$('.time').html(time);
	}
};