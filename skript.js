var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";

function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}

var moskaImena = [];
var zenskaImena = [];
var EHRvTabeli = 0;
var itm;

$(document).ready(function () {
	$.get("stat_podatki/moska_imena.txt", function (response) {
		moskaImena = response.toLocaleLowerCase().split('\n');
		//console.log(moskaImena);
	});
	$.get("stat_podatki/zenska_imena.txt", function (response) {
		zenskaImena = response.toLocaleLowerCase().split('\n');
		//console.log(zenskaImena);
	});

	EHRvTabeli = $('#preberiEHRid').text();
	//console.log(EHRvTabeli);

	preberiEHRodBolnika();
	//narisiGraf();

	/* Don't forget list */
	$("#sortable").sortable();
	$("#sortable").disableSelection();

	countTodos();

	// all done btn
	$("#checkAll").click(function(){
		AllDone();
	});

	//create
	$('.add-todo').on('keypress',function (e) {
		e.preventDefault
		if (e.which == 13) {
			if($(this).val() != ''){
				var todo = $(this).val();
				createTodo(todo);
				countTodos();
			}else{
				// some validation
			}
		}
	});
	// mark task as done
	$('.todolist').on('change','#sortable li input[type="checkbox"]',function(){
		if($(this).prop('checked')){
			var doneItem = $(this).parent().parent().find('label').text();
			$(this).parent().parent().parent().addClass('remove');
			done(doneItem);
			countTodos();
		}
	});

	//delete done task from "already done"
	$('.todolist').on('click','.remove-item',function(){
		removeItem(this);
	});

	// count tasks
	function countTodos(){
		var count = $("#sortable li").length;
		$('.count-todos').html(count);
	}

	//create task
	function createTodo(text){
		var markup = '<li class="ui-state-default"><div class="checkbox"><label><input type="checkbox" value="" />'+ text +'</label></div></li>';
		$('#sortable').append(markup);
		$('.add-todo').val('');
	}

	//mark task as done
	function done(doneItem){
		var done = doneItem;
		var markup = '<li>'+ done +'<button class="btn btn-default btn-xs pull-right  remove-item"><span class="glyphicon glyphicon-remove"></span></button></li>';
		$('#done-items').append(markup);
		$('.remove').remove();
	}

	//mark all tasks as done
	function AllDone(){
		var myArray = [];

		$('#sortable li').each( function() {
			myArray.push($(this).text());
		});

		// add to done
		for (i = 0; i < myArray.length; i++) {
			$('#done-items').append('<li>' + myArray[i] + '<button class="btn btn-default btn-xs pull-right  remove-item"><span class="glyphicon glyphicon-remove"></span></button></li>');
		}

		// myArray
		$('#sortable li').remove();
		countTodos();
	}

	//remove done task from list
	function removeItem(element){
		$(element).parent().remove();
	}
	/* Don't forget list - over */
});

function kreirajEHRzaBolnika() {

	sessionId = getSessionId();

	var ime = $("#kreirajIme").val();
	var priimek = $("#kreirajPriimek").val();
	var datumRojstva = $("#kreirajDatumRojstva").val();

	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 || priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]
		        };
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo label label-success fade-in'>Uspešno kreiran EHR '" + ehrId + "'.</span>");
		                    console.log("Uspešno kreiran EHR '" + ehrId + "'.");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
		            	console.log(JSON.parse(err.responseText).userMessage);
		            }
		        });
		    }
		});
	}
}

var ime;
var pogostoIme;
var zaporednaStImena;
var visina;
var teza;

function preberiEHRodBolnika() {
	sessionId = getSessionId();

	//var ehrId = $("#preberiEHRid").val();
	var ehrId = EHRvTabeli;

	pogostoIme = false;

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label label-success fade-in'>Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.</span>");
				//console.log("Bolnik '" + party.firstNames + " " + party.lastNames + "', ki se je rodil '" + party.dateOfBirth + "'.");
				var imeReturn = party.firstNames;
				ime = imeReturn.toLocaleLowerCase();
				//console.log(ime);

				for (var i in moskaImena) {
					if (ime === moskaImena[i]) {
						pogostoIme = true;
						zaporednaStImena = i;
					}
				}
				for (var i in zenskaImena) {
					if (ime === zenskaImena[i]) {
						pogostoIme = true;
						zaporednaStImena = i;
					}
				}
				//console.log(pogostoIme);
				//console.log(zaporednaStImena);

				if (pogostoIme == true) {
					//$("#pogostoIme").html("<span class='obvestilo label label-warning fade-in'>DA");
					$("#pogostoIme").html("DA");
					$("#zaporednoMestoImena").html(zaporednaStImena);
				} else {
					$("#pogostoIme").html("NE");
				}

			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				//console.log(JSON.parse(err.responseText).userMessage);
			}
		});

		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				var party = data.party;
				//$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>'" + "'</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
				$.ajax({
					url: baseUrl + "/view/" + ehrId + "/" + "height",
					type: 'GET',
					headers: {"Ehr-Session": sessionId},
					success: function (res) {
						if (res.length > 0) {
							var visinaTemp = res[res.length - 1];
							visina = visinaTemp.height;
							var odstopanje = visina - 174;
							$("#visinaPacient").html(visina);
							$("#visinaOdstopanje").html(odstopanje);
						} else {
							$("#visinaPacient").html("<span class='obvestilo label label-warning fade-in'>Ni podatka!</span>");
						}
					},
					error: function () {
						$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
						console.log(JSON.parse(err.responseText).userMessage);
					}
				});
			},
			error: function(err) {
				$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});

		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				var tabelaTeze = [];
				var tabelaKorakov = [];
				var tabelaStMeritev = [];
				var party = data.party;
				//$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>'" + "'</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
				$.ajax({
					url: baseUrl + "/view/" + ehrId + "/" + "weight",
					type: 'GET',
					headers: {"Ehr-Session": sessionId},
					success: function (res) {
						if (res.length > 0) {
							for (var i in res) {
								tabelaTeze[i] = res[i].weight;
								//console.log(res[i].time);
								//console.log(tabelaTeze[i]);
								tabelaStMeritev[i] = 71;
								tabelaKorakov[i] = i;
							}
							var tezaTemp = res[res.length - 1];
							teza = tezaTemp.weight;
							var odstopanje = teza - 71;
							//console.log(teza);
							$("#tezaPacient").html(teza);
							$("#tezaOdstopanje").html(odstopanje);
						} else {
							$("#tezaPacient").html("<span class='obvestilo label label-warning fade-in'>Ni podatka!</span>");
						}
						$(function () {
							$('#container').highcharts({
								title: {
									text: 'Graf telesne teže',
									x: -20 //center
								},
								xAxis: {
									categories: tabelaKorakov
								},
								yAxis: {
									title: {
										text: 'Teža'
									},
									plotLines: [{
										value: 0,
										width: 1,
										color: '#f0ad4e'
									}]
								},
								tooltip: {
									valueSuffix: 'kg'
								},
								legend: {
									layout: 'vertical',
									align: 'right',
									verticalAlign: 'middle',
									borderWidth: 0
								},
								series: [{
									name: 'pacient',
									data: tabelaTeze
								}, {
									name: 'povprečje',
									data: tabelaStMeritev
								}]
							});
						});
					},
					error: function () {
						$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
						console.log(JSON.parse(err.responseText).userMessage);
					}
				});
			},
			error: function(err) {
				$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});

		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
			success: function (data) {
				var tabelaTemperatur = [];
				var tabelaStMeritevT = [];
				var tabelaKorakovT = [];
				var party = data.party;
				//$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
					$.ajax({
						url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
						type: 'GET',
						headers: {"Ehr-Session": sessionId},
						success: function (res) {
							if (res.length > 0) {
								for (var i in res) {
									tabelaTemperatur[i] = res[i].temperature;
									//console.log(tabelaTemperatur[i]);
									tabelaStMeritevT[i] = 36;
									tabelaKorakovT[i] = i;
								}
							} else {
								$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
							}
							$(function () {
								$('#container2').highcharts({
									title: {
										text: 'Graf telesne temperature',
										x: -20 //center
									},
									xAxis: {
										categories: tabelaKorakovT
									},
									yAxis: {
										title: {
											text: 'Temperatura'
										},
										plotLines: [{
											value: 0,
											width: 1,
											color: '#f0ad4e'
										}]
									},
									tooltip: {
										valueSuffix: '[°C]'
									},
									legend: {
										layout: 'vertical',
										align: 'right',
										verticalAlign: 'middle',
										borderWidth: 0
									},
									series: [{
										name: 'pacient',
										data: tabelaTemperatur
									}, {
										name: 'povprečje',
										data: tabelaStMeritevT
									}]
								});
							});
						},
						error: function () {
							$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
						}
					});
			},
			error: function(err) {
				$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
			}
		});
	}
	/* Nista več vidni navzven!
	console.log("izpisi tezo");
	for (var i in tabelaTeze) {
		console.log(tabelaTeze[i]);
	}
	console.log("izpisi temperaturo");
	for (var i in tabelaTemperatur) {
		console.log(tabelaTemperatur[i]);
	}
	*/
}

function izracunajITM() {
	var visinaMeter = visina/100;
	var visinaKvadrat = visinaMeter * visinaMeter;
	itm = teza / visinaKvadrat;
	$("#itm").html(itm);

	if(itm < 18.5) {
		$("#prvicA").html("<span class='itm-pobarvaj'>manj kot 18,5</span>");
		$("#prvicB").html("<span class='itm-pobarvaj'>podhranjenost</span>");
	} else if((itm >= 18.5) && (itm <= 25)) {
		$("#drugicA").html("<span class='itm-pobarvaj'>od 18,5 do 25,0</span>");
		$("#drugicB").html("<span class='itm-pobarvaj'>normalna telesna teža</span>");
	} else if((itm >= 25,1) && (itm <= 30)) {
		$("#tretjicA").html("<span class='itm-pobarvaj'>od 25,1 do 30,0</span>");
		$("#tretjicB").html("<span class='itm-pobarvaj'>čezmerna telesna teža</span>");
	} else {
		$("#cetrticA").html("<span class='itm-pobarvaj'>30,1 in več</span>");
		$("#cetrticB").html("<span class='itm-pobarvaj'>debelost</span>");
	}
}

function dodajMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	var merilec = $("#dodajVitalnoMerilec").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Preview Structure: https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    "ehrId": ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT',
		    committer: merilec
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		    	console.log(res.meta.href);
		        $("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-success fade-in'>" + res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
		    }
		});
	}
}

function preberiMeritveVitalnihZnakov() {
	sessionId = getSessionId();	

	var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames + " " + party.lastNames + "'</b>.</span><br/><br/>");
				if (tip == "telesna temperatura") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].temperature + " " 	+ res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna teža</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time + "</td><td class='text-right'>" + res[i].weight + " " 	+ res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
					    }
					});
				} else if (tip == "telesna teža AQL") {
					var AQL =
						"select " +
						"a_a/data[at0002]/events[at0003]/time/value as time, " +
						"a_a/data[at0002]/events[at0003]/data[at0001]/items[at0004, 'Body weight']/value/units as Body_weight_units, " +
						"a_a/data[at0002]/events[at0003]/data[at0001]/items[at0004, 'Body weight']/value/magnitude as Body_weight_magnitude " +
						//"from EHR e[ehr_id/value='b931580f-2b05-488b-985b-8d9ffb08ad02'] " +
						"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
						"contains COMPOSITION a " +
						"contains OBSERVATION a_a[openEHR-EHR-OBSERVATION.body_weight.v1] " +
						"where a_a/data[at0002]/events[at0003]/data[at0001]/items[at0004, 'Body weight']/value/magnitude>100 " +
						"order by a_a/data[at0002]/events[at0003]/time/value desc " +
						"offset 0 limit 10";
					$.ajax({
						url: baseUrl + "/query?" + $.param({"aql": AQL}),
						type: 'GET',
						headers: {"Ehr-Session": sessionId},
						success: function (res) {
							var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna teža</th></tr>";
							if (res) {
								var rows = res.resultSet;
								for (var i in rows) {
									results += "<tr><td>" + rows[i].time + "</td><td class='text-right'>" + rows[i].Body_weight_magnitude + " " 	+ rows[i].Body_weight_units + "</td>";
								}
								results += "</table>";
								$("#rezultatMeritveVitalnihZnakov").append(results);
							} else {
								$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
							}
						},
						error: function() {
							$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
						}
					});
				} else if (tip == "telesna temperatura AQL") {
					var AQL =
						"select " +
						"t/data[at0002]/events[at0003]/time/value as cas, " +
						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperatura_vrednost, " +
						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as temperatura_enota " +
						"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
						"contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
						"where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude<35 " +
						"order by t/data[at0002]/events[at0003]/time/value desc " +
						"limit 10";
					$.ajax({
						url: baseUrl + "/query?" + $.param({"aql": AQL}),
						type: 'GET',
						headers: {"Ehr-Session": sessionId},
						success: function (res) {
							var results = "<table class='table table-striped table-hover'><tr><th>Datum in ura</th><th class='text-right'>Telesna temperatura</th></tr>";
							if (res) {
								var rows = res.resultSet;
								for (var i in rows) {
									results += "<tr><td>" + rows[i].cas + "</td><td class='text-right'>" + rows[i].temperatura_vrednost + " " 	+ rows[i].temperatura_enota + "</td>";
								}
								results += "</table>";
								$("#rezultatMeritveVitalnihZnakov").append(results);
							} else {
								$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-warning fade-in'>Ni podatkov!</span>");
							}

						},
						error: function() {
							$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
							console.log(JSON.parse(err.responseText).userMessage);
						}
					});
				}
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo label label-danger fade-in'>Napaka '" + JSON.parse(err.responseText).userMessage + "'!");
				console.log(JSON.parse(err.responseText).userMessage);
	    	}
		});
	}
}

$(document).ready(function() {
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});
	$('#preberiPredlogoBolnika').change(function() {
		$("#kreirajSporocilo").html("");
		var podatki = $(this).val().split(",");
		$("#kreirajIme").val(podatki[0]);
		$("#kreirajPriimek").val(podatki[1]);
		$("#kreirajDatumRojstva").val(podatki[2]);
	});
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});
});

/* Contact */
$(document).ready(function() {
    var panels = $('.vote-results');
    var panelsButton = $('.dropdown-results');
    panels.hide();

    //Click dropdown
    panelsButton.click(function() {
        //get data-for attribute
        var dataFor = $(this).attr('data-for');
        var idFor = $(dataFor);

        //current button
        var currentButton = $(this);
        idFor.slideToggle(400, function() {
            //Completed slidetoggle
            if(idFor.is(':visible'))
            {
                currentButton.html('Hide Results');
            }
            else
            {
                currentButton.html('View Results');
            }
        })
    });
});
/* Contact - over */

/* CircleHoverEffect */
	;window.Modernizr=function(a,b,c){function z(a){j.cssText=a}function A(a,b){return z(m.join(a+";")+(b||""))}function B(a,b){return typeof a===b}function C(a,b){return!!~(""+a).indexOf(b)}function D(a,b){for(var d in a)if(j[a[d]]!==c)return b=="pfx"?a[d]:!0;return!1}function E(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:B(f,"function")?f.bind(d||b):f}return!1}function F(a,b,c){var d=a.charAt(0).toUpperCase()+a.substr(1),e=(a+" "+o.join(d+" ")+d).split(" ");return B(b,"string")||B(b,"undefined")?D(e,b):(e=(a+" "+p.join(d+" ")+d).split(" "),E(e,b,c))}var d="2.5.3",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n="Webkit Moz O ms",o=n.split(" "),p=n.toLowerCase().split(" "),q={},r={},s={},t=[],u=t.slice,v,w=function(a,c,d,e){var f,i,j,k=b.createElement("div"),l=b.body,m=l?l:b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),k.appendChild(j);return f=["&#173;","<style>",a,"</style>"].join(""),k.id=h,(l?k:m).innerHTML+=f,m.appendChild(k),l||(m.style.background="",g.appendChild(m)),i=c(k,a),l?k.parentNode.removeChild(k):m.parentNode.removeChild(m),!!i},x={}.hasOwnProperty,y;!B(x,"undefined")&&!B(x.call,"undefined")?y=function(a,b){return x.call(a,b)}:y=function(a,b){return b in a&&B(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=u.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(u.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(u.call(arguments)))};return e});var G=function(a,c){var d=a.join(""),f=c.length;w(d,function(a,c){var d=b.styleSheets[b.styleSheets.length-1],g=d?d.cssRules&&d.cssRules[0]?d.cssRules[0].cssText:d.cssText||"":"",h=a.childNodes,i={};while(f--)i[h[f].id]=h[f];e.csstransforms3d=(i.csstransforms3d&&i.csstransforms3d.offsetLeft)===9&&i.csstransforms3d.offsetHeight===3},f,c)}([,["@media (",m.join("transform-3d),("),h,")","{#csstransforms3d{left:9px;position:absolute;height:3px;}}"].join("")],[,"csstransforms3d"]);q.cssanimations=function(){return F("animationName")},q.csstransforms=function(){return!!F("transform")},q.csstransforms3d=function(){var a=!!F("perspective");return a&&"webkitPerspective"in g.style&&(a=e.csstransforms3d),a},q.csstransitions=function(){return F("transition")};for(var H in q)y(q,H)&&(v=H.toLowerCase(),e[v]=q[H](),t.push((e[v]?"":"no-")+v));return z(""),i=k=null,function(a,b){function g(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function h(){var a=k.elements;return typeof a=="string"?a.split(" "):a}function i(a){var b={},c=a.createElement,e=a.createDocumentFragment,f=e();a.createElement=function(a){var e=(b[a]||(b[a]=c(a))).cloneNode();return k.shivMethods&&e.canHaveChildren&&!d.test(a)?f.appendChild(e):e},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+h().join().replace(/\w+/g,function(a){return b[a]=c(a),f.createElement(a),'c("'+a+'")'})+");return n}")(k,f)}function j(a){var b;return a.documentShived?a:(k.shivCSS&&!e&&(b=!!g(a,"article,aside,details,figcaption,figure,footer,header,hgroup,nav,section{display:block}audio{display:none}canvas,video{display:inline-block;*display:inline;*zoom:1}[hidden]{display:none}audio[controls]{display:inline-block;*display:inline;*zoom:1}mark{background:#FF0;color:#000}")),f||(b=!i(a)),b&&(a.documentShived=b),a)}var c=a.html5||{},d=/^<|^(?:button|form|map|select|textarea)$/i,e,f;(function(){var a=b.createElement("a");a.innerHTML="<xyz></xyz>",e="hidden"in a,f=a.childNodes.length==1||function(){try{b.createElement("a")}catch(a){return!0}var c=b.createDocumentFragment();return typeof c.cloneNode=="undefined"||typeof c.createDocumentFragment=="undefined"||typeof c.createElement=="undefined"}()})();var k={elements:c.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:c.shivCSS!==!1,shivMethods:c.shivMethods!==!1,type:"default",shivDocument:j};a.html5=k,j(b)}(this,b),e._version=d,e._prefixes=m,e._domPrefixes=p,e._cssomPrefixes=o,e.testProp=function(a){return D([a])},e.testAllProps=F,e.testStyles=w,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+t.join(" "):""),e}(this,this.document);
/* CircleHoverEffect - over */