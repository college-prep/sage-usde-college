const searchBox = document.getElementById('search-box');
const resultCont = document.querySelector('.result-container');


function doSearch() {
	$('.school-card').remove();
	var schoolName = searchBox.value;
	request(`https://api.data.gov/ed/collegescorecard/v1/schools.json?api_key=j7wcTx0TdVV4gl93JobRFSOspmmLOtdxO5gg0AeK
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
			`
		.replace(/\s\n/g,''), function (result) {
			var collegeList = JSON.parse(result);
			
			console.log(collegeList);
			console.log(JSON.stringify(collegeList));
			
			collegeList.results.forEach(function(c) {
				console.log(c['school.name'] + '\n' +  c['school.school_url'] + '\n' + c['latest.admissions.']);
				showCard(c);
			});
			
			
			
			
		}
	);
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
		testActScore	= c['latest.admissions.act_scores.midpoint.cumulative'];
	
	var numberApps		= Math.round((acceptRate && studentCount) ? (studentCount/(acceptRate[0]+acceptRate[1])*2||-100) : 'unknown');
	
	sCard.innerHTML = `
		<h1 class="center">${schoolName}</h1>
		<div class="flex">
			<div>
				<span><i class="fa fa-group"></i> ${(studentCount) ? studentCount + ' students' : 'Student count unknown'}</span> 
				<loc><i class="fa fa-map-marker"></i> ${ ((schoolCity) ? schoolCity + ', ' : '') + ((schoolState) ? schoolState : '' ) + ((schoolZip) ? ' ' + schoolZip : '')}</loc><br/>
				<span>Out of State Tuition: $${c['latest.cost.tuition.out_of_state']}</span><br/>
				<span>In-State Tuition: $${c['latest.cost.tuition.in_state']}</span><br/>
				<span>Graduation Rate: ${Math.round(c['latest.completion.completion_rate_4yr_100nt']*10000)/100}%</span><br/>
				<span>Median Earnings: $${c['latest.earnings.10_yrs_after_entry.median']} per year</span><br/>
				<div id="piechart-${c.id}"></div>
			</div>
			<div>
				<h3>Acceptance Rate</h3>
				<span>${(acceptRate) ? (acceptRate[0]+acceptRate[1])*50 : 'unknown'}% of ${(numberApps) ? (numberApps) : 'unknown'} applicants</span>
				<h3>SAT Scores</h3>
				<span>${testSatScore}</span>
				<h3>ACT Scores</h3>
				<span>${testActScore}</span>
			</div>
		</div>
	`;
	
	resultCont.appendChild(sCard);
	drawChart(c);
}

// Load google charts
google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawChart);

// Draw the chart and set the chart values
function drawChart(c) {
	if (c == undefined) return;
	//return;
	var eth_labels = [];
	var hasPercentCount = 0;
	Object.keys(c).forEach(function(k){
		if (/latest.student.demographics.race_ethnicity/.test(k)) {
			String.prototype.capitalize = function() {
				return this.replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
			};
			var lStr = k.replace(/.*?ethnicity\.|_[0-9]{1,6}$|alien/gi,'').replace(/_/g,' ').capitalize().replace(/non\s/gi, 'Non-');
			if (c[k] != null) {
				hasPercentCount ++;
				eth_labels.push([lStr, c[k]]);
			}
		}
	});
	//console.log(eth_labels);
	var data = google.visualization.arrayToDataTable(([
		['Ethnicity', 'Percent']
	]).concat(eth_labels));
	
	if (hasPercentCount == 0) return;
  // Optional; add a title and set the width and height of the chart
  var options = {'title': 'Ethnicity', 'width': 275, 'height': 200, 'chartArea': {'width': '100%', 'height': '80%'},};

  // Display the chart inside the <div> element with id="piechart"
  var chart = new google.visualization.PieChart(document.getElementById('piechart-' + String(c.id)));
  chart.draw(data, options);
}

searchBox.onsearch = doSearch;