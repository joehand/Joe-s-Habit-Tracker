
//some date functions
Date.prototype.countWeeksOfMonth = function() {
  var year         = this.getFullYear();
  var month_number = this.getMonth();
  var used         = this.firstOfMonth() + this.lastOfMonth();
  return Math.ceil( used / 7);
};



Date.prototype.lastOfMonth = function () {
	var year         = this.getFullYear();
	var month_number = this.getMonth();
    var lastOfMonth  = new Date(year, month_number, 0);
	return lastOfMonth.getDate();
};

Date.prototype.firstOfMonth = function () {
	var year         = this.getFullYear();
	var month_number = this.getMonth();
    var firstOfMonth = new Date(year, month_number, 1);
	return firstOfMonth.getDay();
};

Date.prototype.monthName = function() {
	var months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
	return months[this.getMonth()];
};

Date.prototype.daysInMonth = function(month) {
	var days = [31,28,31,30,31,30,31,31,30,31,30,31];
	// Leap year
	if(this.getYear()%4 == 0){
		days[1] = 29;
	}
	return days[this.getMonth()];
};

Date.prototype.daysOfWeek = function() {
	return [ "Sunday" ,"Monday" ,"Tuesday" ,"Wednesday" ,"Thursday" ,"Friday","Saturday"];
};

Date.prototype.formatDate = function () {
  var curr_date = this.getDate();
  var curr_month = this.getMonth() + 1; //Months are zero based
  var curr_year = this.getFullYear();	
  
  return   curr_month + "-" + curr_date +  "-" + curr_year;
};


Date.prototype.formatTime = function () {

	var tt = "AM";
	var hh = this.getHours();
	var nn = "0" + this.getMinutes()

	if(this.getHours()>12){
		hh = this.getHours()-12;
		tt = "PM";
	} else if (this.getHours()===12) {
		hh = this.getHours();
		tt = "PM";
	}		
	return hh + ":" + nn.substr(-2) + " " + tt;
};

Date.prototype.removeHours = function() {
	
  return new Date(this.getFullYear(),this.getMonth(),this.getDate());
};

