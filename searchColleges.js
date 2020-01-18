const loader = document.getElementById('loader');
const errElm = document.getElementById('errElm');

function animate() {
	document.getElementById('lr1').style.opacity = Math.abs(2*Math.sin(Date.now()/400));
	document.getElementById('lr2').style.opacity = Math.abs(2*Math.sin((Date.now()-333)/400));
	document.getElementById('lr3').style.opacity = Math.abs(2*Math.sin((Date.now()-666)/400));
}

var loadAnimate;
startAnimate = function(){loadAnimate = setInterval(function(){ animate();}, 16.6); loader.style.display = "flex"; errElm.style.display = "none";}
stopAnimate = function(){clearInterval(loadAnimate); loader.style.display = "none";}

startAnimate(); stopAnimate();

const searchBox = document.getElementById('search-box');
const resultCont = document.querySelector('.result-container');

var page = 0;
var busy = false;
var schoolName = "";
var req_url = "";
function doSearch() {
	if (busy) return;
	page = 0;
	busy = true;
	$('.school-card').remove();
	startAnimate();
	
	schoolName = searchBox.value;
	req_url = `https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=j7wcTx0TdVV4gl93JobRFSOspmmLOtdxO5gg0AeK&sort=latest.earnings.10_yrs_after_entry.median:desc
	&page=0
	&school.name=${encodeURIComponent(schoolName)}
	&fields=
		id,
		school.name,
		school.city,
		school.state,
		school.zip,
		school.school_url,
		school.price_calculator_url,
		latest.student.size,
		latest.student.enrollment.all,
		latest.student.demographics.race_ethnicity,
		latest.cost.avg_net_price,
		latest.cost.tuition,
		latest.admissions,
		latest.admissions.admission_rate.overall,
		latest.completion.completion_rate_4yr_100nt,
		latest.earnings.10_yrs_after_entry.median,
		latest.academics.program_percentage,
		school.accreditor_code
	`
	
	request(req_url.replace(/\s\n/g,''), function (result) {
			var collegeList = JSON.parse(result);
			
			console.log(collegeList);
			console.log(JSON.stringify(collegeList));
			
			if (collegeList.results.length == 0) {
				stopAnimate();
				errElm.style.display = "";
				busy = false;
				return;
			}
			
			collegeList.results.forEach(function(c) {
				console.log(c['school.name'] + '\n' +  c['school.school_url'] + '\n' + c['latest.admissions.']);
				showCard(c);
			});
		}
	);
	page ++;
}

function showCard(c) {
	var sCard = document.createElement('div');
	sCard.setAttribute('class', 'school-card');
	
	var schoolName		= c['school.name'],
		studentCount	= c['latest.student.size'],
		schoolCity		= c['school.city'],
		schoolState		= c['school.state'],
		schoolZip		= c['school.zip'],
		tuitionOut		= c['latest.cost.tuition.out_of_state'],
		tuitionIn		= c['latest.cost.tuition.in_state'],
		completeRate	= Math.round(c['latest.completion.completion_rate_4yr_100nt']*100000)/1000,
		tenYrEarnings	= c['latest.earnings.10_yrs_after_entry.median'],
		acceptRate		= c['latest.admissions.admission_rate.overall'],
		testSatScore	= c['latest.admissions.sat_scores.average.overall'],
		testActScore	= c['latest.admissions.act_scores.midpoint.cumulative'],
		prgmPercents	= c['latest.academics.program_percentage'];
	
	var numberApps		= Math.round((acceptRate && studentCount) ? (studentCount/(acceptRate[0]+acceptRate[1])*2||-100) : 'unknown');
	
	sCard.innerHTML = `
		<h1 class="center">${schoolName}</h1>
		<data id="data-${c.id}" style="display: none;">${JSON.stringify(c)}</data>
		<div class="flex" style="position: relative;">
			<div>
				<span><i class="fa fa-group infoicon"></i> ${(studentCount) ? studentCount + ' students' : 'Student count unknown'}</span> 
				<loc><i class="fa fa-map-marker"></i> ${ ((schoolCity) ? schoolCity + ', ' : '') + ((schoolState) ? schoolState : '' ) + ((schoolZip) ? ' ' + schoolZip : '')}</loc><br/>
				<span><i class="fa fa-money infoicon"></i> ${(tuitionOut && (tuitionOut == tuitionIn)) ? 'Tuition: $' + tuitionOut : ((tuitionOut) ? 'Out of State Tuition: $' + tuitionOut : 'Tuition: unknown')}</span><br/>
				${(tuitionIn && (tuitionIn != tuitionOut)) ? '<span><i class="fa fa-money infoicon"></i> In-State Tuition: $' + tuitionIn + '</span><br/>': ''}
				<span><i class="fa fa-graduation-cap infoicon"></i> Graduation Rate: ${(completeRate) ? completeRate + "%" : "unknown"}</span><br/>
				<span><i class="fa fa-dollar infoicon"></i> Graduates&rsquo; Salary: ${(tenYrEarnings) ? '~$' + tenYrEarnings : 'unknown'} per year</span><br/>
				<div id="piechart-${c.id}"></div>
			</div>
			<div class="center">
				<h3>Acceptance Rate</h3>
				${(acceptRate && numberApps) ? '<span>' + ((acceptRate) ? Math.round((acceptRate[0]+acceptRate[1])*5000)/100 : 'unknown') + '% of ' + ((numberApps) ? (numberApps) : 'unknown') + ' applicants</span>' : 'Unknown Acceptance Rate'}
				<br/><h3>SAT Scores</h3>
				<span>Average SAT Score: ${testSatScore||'no data'}</span>
				<br/><h3>ACT Scores</h3>
				<span>Median ACT Score: ${testActScore||'no data'}</span>
			</div>
			<span style="position:absolute; bottom: -8px; right: -12px; text-align: center;"><a href="javascript:(function(){showCollege(JSON.parse(document.getElementById('data-${c.id}').innerHTML))}())"><i class="fa fa-ellipsis-h"></i></a></span>
		</div>
	`;
	
	resultCont.appendChild(sCard);
	drawChart(c, 'Subjects', 'piechart-', '#fafafa');
	
	hasResults = true;
	busy = false;
	stopAnimate();
}

function showCollege(c) {
	var cCard = document.querySelector('.more-info');
	
	console.log(c);
	
	cCard.style.bottom = '0';
	
	var schoolName		= c['school.name'],
		studentCount	= c['latest.student.size'],
		schoolCity		= c['school.city'],
		schoolState		= c['school.state'],
		schoolZip		= c['school.zip'],
		schoolUrl		= c['school.school_url'],
		schoolUrlP		= c['school.price_calculator_url'],
		tuitionOut		= c['latest.cost.tuition.out_of_state'],
		tuitionIn		= c['latest.cost.tuition.in_state'],
		completeRate	= Math.round(c['latest.completion.completion_rate_4yr_100nt']*100000)/1000,
		tenYrEarnings	= c['latest.earnings.10_yrs_after_entry.median'],
		acceptRate		= c['latest.admissions.admission_rate.overall'],
		testSatScore	= c['latest.admissions.sat_scores.average.overall'],
		testActScore	= c['latest.admissions.act_scores.midpoint.cumulative'],
		prgmPercents	= c['latest.academics.program_percentage'];
	var SATall			= testSatScore,
		SATread1		= c['latest.admissions.sat_scores.25th_percentile.critical_reading']||'unknown',
		SATread2		= c['latest.admissions.sat_scores.midpoint.critical_reading']||'unknown',
		SATread3		= c['latest.admissions.sat_scores.75th_percentile.critical_reading']||'unknown',
		SATwrite1		= c['latest.admissions.sat_scores.25th_percentile.writing']||'unknown',
		SATwrite2		= c['latest.admissions.sat_scores.midpoint.writing']||'unknown',
		SATwrite3		= c['latest.admissions.sat_scores.75th_percentile.writing']||'unknown',
		SATmath1		= c['latest.admissions.sat_scores.25th_percentile.math']||'unknown',
		SATmath2		= c['latest.admissions.sat_scores.midpoint.math']||'unknown',
		SATmath3		= c['latest.admissions.sat_scores.75th_percentile.math']||'unknown',
		ACTall1			= c['latest.admissions.act_scores.25th_percentile.cumulative']||'unknown',
		ACTall2			= testActScore,
		ACTall3			= c['latest.admissions.act_scores.75th_percentile.cumulative']||'unknown',
		ACTela1			= c['latest.admissions.act_scores.25th_percentile.english']||'unknown',
		ACTela2			= c['latest.admissions.act_scores.midpoint.english']||'unknown',
		ACTela3			= c['latest.admissions.act_scores.75th_percentile.english']||'unknown',
		ACTwrite1			= c['latest.admissions.act_scores.25th_percentile.writing']||'unknown',
		ACTwrite2		= c['latest.admissions.act_scores.midpoint.writing']||'unknown',
		ACTwrite3		= c['latest.admissions.act_scores.75th_percentile.writing']||'unknown',
		ACTmath1		= c['latest.admissions.act_scores.25th_percentile.math']||'unknown',
		ACTmath2		= c['latest.admissions.act_scores.midpoint.math']||'unknown',
		ACTmath3		= c['latest.admissions.act_scores.75th_percentile.math']||'unknown';
	
	var numberApps		= Math.round((acceptRate && studentCount) ? (studentCount/(acceptRate[0]+acceptRate[1])*2||-100) : 'unknown');
	
	cCard.innerHTML = `
		<h1 class="center">${schoolName}</h1>
		<button class="closebtn" onclick="document.body.style.overflow='';document.querySelector('.more-info').style.bottom='-100%';setTimeout(function(){document.querySelector('.more-info').innerHTML=''},1000)"><i class="fa fa-close"></i></button>
		<data style="display: none;">${JSON.stringify(c)}</data>
		<div class="flex info-flex">
			<div>
				<span><i class="fa fa-group"></i> ${(studentCount) ? studentCount + ' students' : 'Student count unknown'}</span> 
				<span><i class="fa fa-map-marker"></i> ${ ((schoolCity) ? schoolCity + ', ' : '') + ((schoolState) ? schoolState : '' ) + ((schoolZip) ? ' ' + schoolZip : '')}</span><br/>
				<span><i class="fa fa-money"></i> ${(tuitionOut && (tuitionOut == tuitionIn)) ? 'Tuition: $' + tuitionOut : ((tuitionOut) ? 'Out of State Tuition: $' + tuitionOut : 'Tuition: unknown')}</span><br/>
				${(tuitionIn && (tuitionIn != tuitionOut)) ? '<span><i class="fa fa-money"></i> In-State Tuition: $' + tuitionIn + '</span><br/>': ''}
				<span><i class="fa fa-graduation-cap"></i> Graduation Rate: ${(completeRate) ? completeRate + "%" : "unknown"}</span><br/>
				<span><i class="fa fa-dollar"></i> Graduates&rsquo; Salary: ${(tenYrEarnings) ? '~$' + tenYrEarnings : 'unknown'} per year</span><br/>
				<div id="piechart2-${c.id}"></div>
				<div id="ethpie${c.id}"></div>
			</div>
			<div>
				<div>
					<span><i class="fa fa-check"></i> Acceptance Rate: ${(acceptRate && numberApps) ? ((acceptRate) ? Math.round((acceptRate[0]+acceptRate[1])*5000)/100 : 'unknown') + '% of ' + ((numberApps) ? (numberApps) : 'unknown') + ' applicants' : 'Unknown Acceptance Rate'}</span><br/>
					<span><i class="fa fa-globe"></i> School Website: ${(schoolUrl)?'<a href="' + ((/^http/.test(schoolUrl)) ? '' : 'http://') + schoolUrl + '">' + ((/^http/.test(schoolUrl)) ? '' : 'http://') + schoolUrl + '</a>' :''}</span><br/>
					<span><i class="fa fa-calculator"></i> Price Calculator: ${(schoolUrl)?'<a href="' + ((/^http/.test(schoolUrlP)) ? '' : 'http://') + schoolUrlP + '">' + schoolName + ' Financial Calculator</a>' :''}</span><br/>
				</div>
				<div class="center flex">
					<span>
						<h3>SAT Scores</h3>
						<table><tr><th>Category</th><th>Score</th></tr><tr><td>Reading, 25th Percentile</td><td>${SATread1}</td></tr><tr><td>Reading, Median Score</td><td>${SATread2}</td></tr><tr><td>Reading, 75th Percentile</td><td>${SATread3}</td></tr><tr><td>Writing, 25th Percentile</td><td>${SATwrite1}</td></tr><tr><td>Writing, Median Score</td><td>${SATwrite2}</td></tr><tr><td>Writing, 75th Percentile</td><td>${SATwrite3}</td></tr><tr><td>Math, 25th Percentile</td><td>${SATmath1}</td></tr><tr><td>Math, Median Score</td><td>${SATmath2}</td></tr><tr><td>Math, 75th Percentile</td><td>${SATmath3}</td></tr><tr><td>Overall Average Score</td><td>${SATall}</td></tr></table>
					</span>
					<span>
						<h3>ACT Scores</h3>
						<table><tr><th>Category</th><th>Score</th></tr><tr><td>English, 25th Percentile</td><td>${ACTela1}</td></tr><tr><td>English, Median Score</td><td>${ACTela2}</td></tr><tr><td>English, 75th Percentile</td><td>${ACTela3}</td></tr><tr><td>Writing, 25th Percentile</td><td>${ACTwrite1}</td></tr><tr><td>Writing, Median Score</td><td>${ACTwrite2}</td></tr><tr><td>Writing, 75th Percentile</td><td>${ACTwrite3}</td></tr><tr><td>Math, 25th Percentile</td><td>${ACTmath1}</td></tr><tr><td>Math, Median Score</td><td>${ACTmath2}</td></tr><tr><td>Math, 75th Percentile</td><td>${ACTmath3}</td></tr><tr><td>Overall Median Score</td><td>${ACTall2}</td></tr><tr><td>Overall 25th Percentile</td><td>${ACTall1}</td></tr><tr><td>Overall 75th Percentile</td><td>${ACTall3}</td></tr></table>
					</span>
				</div>
			</div>
		</div>
	`;
	
	drawChart(c, 'Subjects', 'piechart2-', '#eee');
	drawChart(c, 'Ethnicity', 'ethpie', '#eee');
	
	//Stop Scroll
	document.body.style.overflow = 'hidden';
}

// Load google charts
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

// Draw the chart and set the chart values
function drawChart(c, chartTitle, prefix, bgColor) {
	if (c == undefined) return;
	
	bgColor = bgColor||'#fafafa';
	
	String.prototype.capitalize = function() {
		return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
	};
	
	var labels = [];
	var hasPercentCount = 0;
	var otherPercent = 0;
	Object.keys(c).forEach(function(k){
		if (prefix == "ethpie") {
			if (/latest.student.demographics.race_ethnicity/.test(k)) {
				var lStr = k.replace(/.*?ethnicity\.|_[0-9]{1,6}$|alien/gi,'').replace(/_/g,' ').capitalize().replace(/non\s/gi, 'Non-');
				if (c[k] != null) {
					hasPercentCount ++;
					labels.push([lStr, c[k]]);
				}
			}
		} else {
			if (/latest.academics.program_percentage/.test(k)) {
				var lStr = k.replace(/latest\.academics\.program_percentage\./,'').replace(/_/g,' ').capitalize();
				if (c[k] != null) {
					if (c[k] > 0.005) {
						hasPercentCount ++;
						labels.push([lStr, c[k]]);
					} else {
						otherPercent += c[k];
					}
				}
			}
		}
	});
	console.log(otherPercent);
	if (otherPercent > 0) labels.push(['Other', otherPercent]);
	//console.log(labels);
	var data = google.visualization.arrayToDataTable(([
		['Subject', 'Percent']
	]).concat(labels));
	
	if (hasPercentCount == 0) return;
  // Optional; add a title and set the width and height of the chart
  var options = {'title': chartTitle, 'width': 450, 'height': 250, 'chartArea': {'width': '100%', 'height': '80%'},'tooltip':{'trigger': 'selection'}, 'backgroundColor': bgColor, 'titleTextStyle':{'fontSize':18}};

  // Display the chart inside the <div> element with id="piechart"
  var chart = new google.visualization.PieChart(document.getElementById(prefix + String(c.id)));
  chart.draw(data, options);
}

searchBox.onsearch = doSearch;

var hasResults = false;
$(window).scroll(function() {
   if($(window).scrollTop() + $(window).height() > $(document).height() - 10 && !busy && hasResults) {
		busy = true;
		request(req_url.replace(/&page=[0-9]+/,'&page=' + page)
			.replace(/\s\n/g,''), function (result) {
			var collegeList = JSON.parse(result);
			
			console.log(collegeList);
			console.log(JSON.stringify(collegeList));
			
			if (collegeList.results.length == 0) {
				busy = false;
				return;
			}
			
			collegeList.results.forEach(function(c) {
				console.log(c['school.name'] + '\n' +  c['school.school_url'] + '\n' + c['latest.admissions.']);
				showCard(c);
			});
		}
	); page ++;
   }
});