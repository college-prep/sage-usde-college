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
	var sCard = document.createElement('div')
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
		<data style="display: none;">${JSON.stringify(c)}</data>
		<div class="flex">
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
				${(testSatScore) ? '<br/><span><a href=""><i class="fa fa-ellipsis-h"></i></a></span>' : ''}
				<br/><h3>ACT Scores</h3>
				<span>Median ACT Score: ${testActScore||'no data'}</span>
				${(testSatScore) ? '<br/><span><a href=""><i class="fa fa-ellipsis-h"></i></a></span>' : ''}
			</div>
		</div>
	`;
	
	resultCont.appendChild(sCard);
	drawChart(c);
	
	hasResults = true;
	busy = false;
	stopAnimate();
}

// Load google charts
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

// Draw the chart and set the chart values
function drawChart(c) {
	if (c == undefined) return;
	
	String.prototype.capitalize = function() {
		return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
	};
	
	var labels = [];
	var hasPercentCount = 0;
	var otherPercent = 0;
	Object.keys(c).forEach(function(k){
		/*if (/latest.student.demographics.race_ethnicity/.test(k)) {
			var lStr = k.replace(/.*?ethnicity\.|_[0-9]{1,6}$|alien/gi,'').replace(/_/g,' ').capitalize().replace(/non\s/gi, 'Non-');
			if (c[k] != null) {
				hasPercentCount ++;
				labels.push([lStr, c[k]]);
			}
		}/**/
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
	});
	console.log(otherPercent);
	if (otherPercent > 0) labels.push(['Other', otherPercent]);
	//console.log(labels);
	var data = google.visualization.arrayToDataTable(([
		['Subject', 'Percent']
	]).concat(labels));
	
	if (hasPercentCount == 0) return;
  // Optional; add a title and set the width and height of the chart
  var options = {'title': 'Courses', 'width': 450, 'height': 250, 'chartArea': {'width': '100%', 'height': '80%'},'tooltip':{'trigger': 'selection'}, 'backgroundColor': '#fafafa', 'titleTextStyle':{'fontSize':18}};

  // Display the chart inside the <div> element with id="piechart"
  var chart = new google.visualization.PieChart(document.getElementById('piechart-' + String(c.id)));
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