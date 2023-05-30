/* global d3 */
import * as topojson from "topojson";
import {select} from "../js/utils/dom.js";
import "intersection-observer";
import scrollama from "scrollama";
import { legendColor } from "d3-svg-legend";
import { toCircle, fromCircle, toRect, fromRect } from "flubber";
import tracker from './utils/tracker';

function resize() {}

function init() {
	let width = select(".mapcontainer").clientWidth;

	let height = select(".mapcontainer").clientHeight;
	let mapOne = d3.select("svg#mapone")
		.attr("width", width)
		.attr("height", height);
	mapOne.append("svg:defs").append("svg:marker")
		.attr("id", "triangle")
		.attr("refX", 6)
		.attr("refY", 6)
		.attr("markerWidth", 30)
		.attr("markerHeight", 30)
		.attr("markerUnits","userSpaceOnUse")
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M 0 0 12 6 0 12 3 6")
		.style("fill", "black");

	let projection = d3.geoMercator()


	let path = d3.geoPath()
		.projection(projection);

	let flagsBuilt = false;

	const emojiflags = {
		"Philadelphia": "<tspan class='countryname'>Philadelphia </tspan>🇱🇺",
		"Chester": "<tspan class='countryname'>Chester </tspan>🇮🇪",
		"Montgomery": "<tspan class='countryname'>Montgomery </tspan>🇳🇱",
		"Delaware": "<tspan class='countryname'>Delaware </tspan>🇦🇹",
		"Bucks": "<tspan class='countryname'>Bucks </tspan>🇩🇪"
	}

 

	const capitalRegions = ["AT13","BE10","BG41","CY00","CZ01","DE30","EL30","DK01","EE00","ES30","FI1B", "FR10","HR04","HU11","IE06","LU00","LV00","MT00","NL32","ITI4","LT01","PL91","PT17","SI04","SK01","RO32","SE11","UKI4"];

	// d3.json("assets/data/nuts2_gdppps17_topo-RL.geojson", function(nuts2) {
	// 	d3.json("assets/data/nuts0_gdppps17_topo-RL.geojson", function(nuts0) {
	// 		d3.json("assets/data/land-RL.geojson", function(land) {
	// 			d3.json("assets/data/capitals-gdppps17-RL.geojson", function (capitals) {
					d3.json("assets/data/sf_zcta.geojson", function (nuts2) {
						d3.json("assets/data/sf_county.geojson", function (nuts0) {
							d3.json("assets/data/sf_land.geojson", function (land) {
								d3.json("assets/data/sf_capital.geojson", function (capitals) {
						/* Scrollama */
						const scroller = scrollama();
						scroller.setup({
							step: ".step"
						})
						.onStepEnter(handleStepEnter);
						//Tooltip
						let tooltip = d3.select("body").append("div")
    						.attr("class", "tooltip")
							.style("opacity", 0.9);

						function handleStepEnter(step){
							//Track scrolling
							tracker.send({category: `${step.index}-${step.direction}`, action: 'scroll'});

							d3.selectAll(".step").classed("is-active", false);
							d3.select(step.element).classed("is-active", true);
							if(step.index == 1 && step.direction == "down"){
								countries.transition().duration(1000)
									.delay((d, i) => i*100)
									.style("fill-opacity", 0)
									.style("pointer-events", "none");
								title.text("Great Philadelphia ZCTAs")
							}
							if(step.index == 0 && step.direction == "up"){
								title.text("Greater Philadelphia Counties")
								countries.transition().duration(1000)
									.delay((d, i) => i*100)
									.style("fill-opacity", 1);
							}
							if(step.index == 2 && step.direction == "down"){
								scaleLegendCells();
								landsilhouette.transition().duration(2000).style("opacity", 0);
								othercaps.transition().duration(2000).style("opacity", 0);
								graticule.transition().duration(2000).style("opacity", 0);
								eucaps.transition()
									.delay((d,i) => 1000 + 100*i)
									.duration(2000)
									.attr("cx", (d) => devLinearScale(+d.properties.gdppps17))
									.attr("cy", (d) => countryScale(d.properties.CNTR_CODE));
								countries.transition().duration(2000)
									.delay((d, i) => i*200)
									.attrTween("d", function(d){
										return toRect(d3.select(this).attr("d"), devLinearScale(+d.properties.gdppps17) - 6,countryScale(d.properties.CNTR_CODE) - 6, 12, 12);
									});
								regions
									.on("mouseover", function(d){
										tooltip.transition()
											.duration(200)
											.style("opacity", 1)
											.style("background", devscale(+d.properties.gdppps17))
											.style("color", () => {
												if(+d.properties.gdppps17 > 89 && +d.properties.gdppps17 < 110){
													return "#000000";
												}
												else{
													return "#ffffff";
												}
											})

										tooltip.html(d.properties.NUTS_NAME + "<br/>" + d.properties.gdppps17)
											.style("left", (d3.event.pageX + 10) + "px")
											.style("top", (d3.event.pageY - 28) + "px");
										highlightRegions([d.properties.NUTS_ID])
									})
									.transition().duration(2000)
										.delay((d, i) => i*20)
										.attrTween("d", function(d){
											return toCircle(d3.select(this).attr("d"), devLinearScale(+d.properties.gdppps17), countryScale(d.properties.CNTR_CODE), 6);
									});

								let yAxis = d3.axisLeft(countryScale)
									.tickSize(-width);

								mapOne.selectAll(".y-axis").remove();

								mapOne.append("g")
									.attr("transform", `translate(${margin.left}, 0)`)
									.attr("class", "y-axis")
									.call(yAxis).lower();

								// if(!flagsBuilt){
									// let ticksYAxisImage = d3.selectAll(".y-axis .tick")
									// 	.append("image")
									// 	.attr("xlink:href",function(){
									// 		console.log(d3.select(this.parentNode).text().toLowerCase());
									// 		return "assets/img/flags_png/"+(d3.select(this.parentNode).text().toLowerCase())+".png"
									// 	})
									// 	.attr("width",15)
									// 	.attr("height",function(){
									// 		return Math.round(15*.67);
									// 	})
									// 	.style("opacity", 0).transition().delay(3000).duration(1000)
									// 	.style("opacity", 1)

									// 	;
								// 	flagsBuilt = true;
								// }

								// let ticksYAxisImage = d3.selectAll(".y-axis .tick")
								// 	.selectAll("image")
								// 	.style("opacity", 0).transition().delay(3000).duration(1000)
								// 	.style("opacity", 1)

								let ticksYAxis = d3.selectAll(".y-axis .tick text")
									.html(function(){
										// if(contentWidth < 768){
										// 	return emojiflagsMobile[d3.select(this).text()]
										// }
										return emojiflags[d3.select(this).text()]
							 
									})
									.style("opacity", 0).transition().delay(3000).duration(1000)
									.style("opacity", 1)
									;

								let averageTwo = mapOne.insert("g", "path.region")
									.attr("id", "average-two")
									.attr("transform", `translate(${devLinearScale(100)}, 0)`);

								averageTwo.append("line")
									.attr("x1", 0)
									.attr("x2", 0)
									.attr("y1", margin.top)
									.attr("y2", height - 32)
									.attr("class","average-line-two")
									.style("opacity", 0).transition().delay(3000).duration(1000)
									.style("opacity", 1)
									;

							}
							if(step.index == 1 && step.direction == "up"){
								d3.select("#average-two").remove();
								d3.select("#threshold75").remove();
								d3.select("#threshold90").remove();
								d3.select("#threshold100").remove();
								d3.select("#threshold110").remove();
								d3.select("#threshold125").remove();
								d3.select("#threshold600").remove();

								d3.selectAll(".y-axis").transition().duration(2000)
									.style("opacity", 0);

								countries.style("opacity", 1)
									.style("fill-opacity", 0);
								landsilhouette.transition().duration(2000).style("opacity", 1);
								othercaps.transition().duration(2000).style("opacity", 1);
								graticule.transition().duration(2000).style("opacity", 1);
								scaleLegendCellsMap();
								eucaps.transition().delay(1000).duration(2000)
									.attr("cx", (d) => projection(d.geometry.coordinates)[0])
									.attr("cy", (d) => projection(d.geometry.coordinates)[1]);
								countries
									.transition().duration(2000)
									.delay((d, i) => i*200)
									.attrTween("d", function(d){
										return fromRect(devLinearScale(+d.properties.gdppps17), countryScale(d.properties.CNTR_CODE), 6, 6, path(d.geometry));
									});
								regions
									.on("mouseover", function(d){
										tooltip.transition()
											.duration(200)
											.style("opacity", 1)
											.style("background", devscale(+d.properties.gdppps17))
											.style("color", () => {
												if(+d.properties.gdppps17 > 89 && +d.properties.gdppps17 < 110){
													return "#000000";
												}
												else{
													return "#ffffff";
												}
											});
										tooltip.html(d.properties.NUTS_NAME)
											.style("left", (d3.event.pageX + 10) + "px")
											.style("top", (d3.event.pageY - 28) + "px");
										highlightRegions([d.properties.NUTS_ID])
									})
									.transition().duration(2000)
									.delay((d, i) => i*20)
									.attrTween("d", function(d){
										return fromCircle(devLinearScale(+d.properties.gdppps17), countryScale(d.properties.CNTR_CODE), 6, path(d.geometry));
									});
							}
					}
					
						const devscale = d3.scaleThreshold()
							.domain([41626, 50417, 57857, 67438, 83658])
							.range(['#c51b7d','#e9a3c9','#fde0ef','#e6f5d0','#a1d76a','#4d9221']) //Colorbrewer PiYG
						devscale.labels = ["lower income", "", "", "", "", "higher income"];
						const absfundScale = d3.scaleThreshold()
							.domain([500000000, 1000000000, 2000000000, 3000000000, 5000000000])
							.range(["#5B3794","#8F4D9F","#B76AA8","#D78CB1","#F1B1BE","#F8DCD9"].reverse());//RdPu
						absfundScale.labels = ["<50m €", "50-100m", "100-200m", "200-300m", "300-500m", ">500m €"];
						const percapitafundScale = d3.scaleThreshold()
							.domain([41626, 50417, 57857, 67438, 83658])
							.range(["#5B3794","#8F4D9F","#B76AA8","#D78CB1","#F1B1BE","#F8DCD9"].reverse());//RdPu
						percapitafundScale.labels = ["<25 €/cap/y", "25-50", "50-75", "75-125", "125-200", ">200 €/cap/y"];
						const fundpercgdpScale = d3.scaleThreshold()
							.domain([1, 2, 3, 4, 5])
							.range(["#5B3794","#8F4D9F","#B76AA8","#D78CB1","#F1B1BE","#F8DCD9"].reverse());//RdPu
						fundpercgdpScale.labels = ["<1% gdp", "1-2", "2-3", "3-4", "4-5", ">5% gdp"];

						let geojsonNUTS2 = nuts2;
						let geojsonNUTS0 = nuts0;
						geojsonNUTS0.features = geojsonNUTS0.features.sort(function (x, y) {
							return d3.descending(+x.properties.gdppps17, +y.properties.gdppps17)
						})
						let countrycodes = geojsonNUTS0.features.map((country) => country.properties.CNTR_CODE);
						let margin = {"top": 70, "left": 120, "bottom": 50, "right": 120};
						const contentWidth = d3.select("#content").node().clientWidth;
						if(contentWidth < 768){
							margin.left = 75;
							margin.right = 75;
						}
						if(contentWidth < 400){
							margin.left = 55;
							margin.right = 55;
						}
						const marginTitleLegend = 30;
						const mapPadding = 10 + marginTitleLegend;
						//Scales for the dotplot
						const countryScale = d3.scalePoint()
							.domain(countrycodes)
							.range([margin.top + marginTitleLegend, height - margin.bottom])
						const devLinearScale = d3.scaleLinear()
							.domain([20, d3.max(geojsonNUTS2.features, (d) => +d.properties.gdppps17)])
							.range([margin.left, width - 20])
						//Set up map
						let extent = {
							'type': 'Feature',
							'geometry': {
								'type': 'Polygon',
								'coordinates': [[[-76.1, 40.73], [-74.475, 40.73], [-76.1, 39.29], [-74.475, 39.29]]]
							// 'coordinates': [[[0, 70], [35, 70], [0, 35], [35, 35]]]
							}
						}
						projection.fitExtent([[mapPadding, mapPadding + 25], [width - mapPadding, height - mapPadding]], extent);
						let graticule  = mapOne.append("path")
							.datum(d3.geoGraticule())
							.attr("d", path)
							.attr("class", "graticule");
						let landsilhouette = mapOne.selectAll("path.land")
							.data(land.features)
							.enter().append("path")
							.attr("class", "land")
							.attr("d", path);
						//Sort regions based on country gdppps17, so they animate in nice sequence
						geojsonNUTS2.features = geojsonNUTS2.features.sort(function(x, y){
							return d3.ascending(countryScale(x.properties.CNTR_CODE), countryScale(y.properties.CNTR_CODE))
						});

						let regions = mapOne.selectAll("path.region")
							.data(geojsonNUTS2.features)
							.enter().append("path")
							.attr("class", (d) => `region ${d.properties.CNTR_CODE}`)
							.attr("d", path)
							.attr("id", (d) => d.properties.id)
							.style("fill", (d) => devscale(+d.properties.gdppps17))
							.on("mouseover", function(d){
								tooltip.transition()
									.duration(200)
									.style("opacity", 1)
									.style("background", devscale(+d.properties.gdppps17))
									.style("color", () => {
										if(+d.properties.gdppps17 > 89 && +d.properties.gdppps17 < 110){
											return "#000000";
										}
										else{
											return "#ffffff";
										}
								});
								tooltip.html(d.properties.NUTS_NAME)
									.style("left", (d3.event.pageX + 10) + "px")
									.style("top", (d3.event.pageY - 28) + "px");
								highlightRegions([d.properties.NUTS_ID])
							})
							.on("mouseout", function(d){
								tooltip.transition()
									.duration(200)
									.style("opacity", 0);
								dehighlightRegions();
							});
						let countries = mapOne.selectAll("path.country")
							.data(geojsonNUTS0.features)
							.enter().append("path")
							.attr("class", "country")
							.attr("d", path)
							.attr("id", (d) => d.id)
							.style("fill", (d) => devscale(d.properties.gdppps17));

						let eucapsFeatures = capitals.features.filter((cap) => cap.properties.NUTS_ID);
						let othercapsFeatures = capitals.features.filter((cap) => !cap.properties.NUTS_ID);

						let othercaps = mapOne.selectAll("circle.capital")
							.data(othercapsFeatures)
							.enter().append("path")
							.attr("class", "capital other-capital")
							.attr("d", path.pointRadius(3))
							.style("filter", "url(#capitalshadow)")
							.attr("id", (d) => d.name);
						let eucaps = mapOne.selectAll("circle.eucapital")
							.data(eucapsFeatures)
							.enter().append("circle")
							.attr("class", "capital eucapital")
							.attr("r", 3)
							.attr("cx", (d) => projection(d.geometry.coordinates)[0])
							.attr("cy", (d) => projection(d.geometry.coordinates)[1])
							.style("filter", "url(#capitalshadow)")
							.attr("id", (d) => d.name);

						//Legend
						const legendy = 30;
						const legendHeight = 10;
						mapOne.append("g")
							.attr("class", "toplegend tk-atlas")
							.attr("transform", `translate(${margin.left},${legendy + marginTitleLegend})`);
						let legendtop = legendColor()
							.orient("horizontal")
							.shapeWidth((width - margin.left - margin.right)/6)
							.labels(["less developed", "", "", "", "", "more developed"])
							.labelOffset(10)
							.shapePadding(0)
							.shapeHeight(legendHeight)
							.scale(devscale);
						mapOne.select(".toplegend")
							.call(legendtop);
						mapOne.append("line")
							.attr("x1", (width - margin.left - margin.right)/2 + margin.left)
							.attr("x2", (width - margin.left - margin.right)/2 + margin.left)
							.attr("y1", 30 + marginTitleLegend)
							.attr("y2", 46 + marginTitleLegend)
							.attr("y2", 46 + marginTitleLegend)
							.attr("stroke", "black")
							.attr("id", "average-mark")
							.attr("stroke-width", 1);
						mapOne.append("text")
							.attr("x", (width - margin.left - margin.right)/2 + margin.left)
							.attr("y", 58 + marginTitleLegend)
							.text("average")
							.attr("class", "tk-atlas label-outside")
							.attr("id", "average-label")
							.style("text-anchor", "middle");
						let title = mapOne.append("text")
							.attr("x", margin.left + (width - margin.left - margin.right)/2)
							.attr("y", 20 + marginTitleLegend)
							.attr("class", "tk-atlas")
							.attr("id", "title")
							.text("Greater Philadelphia Counties");

						//Dot animations
						let drawAnimation = function(countrycode, region1ID, region2ID, oldvalue, oldregionID, countryNameEmoji){
							const animWidth = select(`.animation-container-${countrycode}`).clientWidth;
							let localScale = d3.scaleLinear()
								.domain([30, 170])
								.range([0, animWidth])
							if(contentWidth < 500){
								localScale.range([0,animWidth]);
							}
							let animsvg = d3.select(`.animation-${countrycode}`)
								.attr("width", animWidth)
								.attr("height", 100);
							let avg = animsvg.append("g")
								.attr("transform", `translate(${localScale(100)}, 20)`);
							avg.append("line")
								.attr("x1", 0)
								.attr("x2", 0)
								.attr("y1", -20)
								.attr("y2", 20)
								.style("stroke-width", 1)
								.style("stroke", "#000000");
							avg.append('text')
								.attr("x", 0)
								.attr("y", 32)
								.text(100)
								.style("text-anchor", "middle")
								.style("fill", "#000000")
								.attr("class", "label-outside tk-atlas");
							let ninety = animsvg.append("g")
								.attr("transform", `translate(${localScale(90)}, 20)`);
							ninety.append("line")
								.attr("x1", 0)
								.attr("x2", 0)
								.attr("y1", -20)
								.attr("y2", 20)
								.style("stroke-width", 1)
								.style("stroke", devscale(89));
							ninety.append('text')
								.attr("x", 0)
								.attr("y", 32)
								.text(90)
								.style("text-anchor", "middle")
								.style("fill", d3.color(devscale(89)).darker(1.2).toString())//d3.color(devscale(89)))
								.attr("class", "label-outside tk-atlas");

							let seventyfive = animsvg.append("g")
								.attr("transform", `translate(${localScale(75)}, 20)`);
							seventyfive.append("line")
								.attr("x1", 0)
								.attr("x2", 0)
								.attr("y1", -20)
								.attr("y2", 20)
								.style("stroke-width", 1)
								.style("stroke", devscale(74));
							seventyfive.append('text')
								.attr("x", 0)
								.attr("y", 32)
								.text(75)
								.style("text-anchor", "middle")
								.style("fill", devscale(74))
								.attr("class", "label-outside tk-atlas");

							let countryRegionsData = geojsonNUTS2.features.filter((reg) => reg.properties.CNTR_CODE == countrycode);
							animsvg.append("line")
								.attr("x1", localScale.range()[0])
								.attr("x2", animWidth)
								.attr("y1", 20)
								.attr("y2", 20)
								.style("stroke", "#999")
								.style("shape-rendering", "crispEdges");
							animsvg.selectAll("circle.countryregion").data(countryRegionsData)
								.enter().append("circle")
								.attr("cx", (d) => {
									if(d.properties.NUTS_ID == region1ID || d.properties.NUTS_ID == region2ID){
										return localScale(oldvalue)
									}
									else{ return localScale(d.properties.gdppps17)}
								})
								.attr("cy", 20)
								.attr("r", 8)
								.style("fill", (d) => devscale(d.properties.gdppps17))
								.style("stroke", "#ffffff")
								.attr("class", (d) => d.properties.NUTS_ID);
							let newRegions = d3.selectAll(`.${region1ID}, .${region2ID}`).raise();

							animsvg.append("circle")
								.attr("cx", localScale(oldvalue))
								.attr("cy", 20)
								.attr("r", 8)
								.style("fill", devscale(oldvalue))
								.style("stroke", "#000000")
								.attr("id", oldregionID)
								.each(update);

							function update() {
								(function repeat() {
									d3.select("#" + oldregionID)
										.style("opacity", 1)
										.transition().duration(5000)
										.style("opacity", 0.1);
									newRegions
										.attr("cx", localScale(oldvalue))
										.transition().duration(5000)
											.attr("cx", (d) => localScale(d.properties.gdppps17))
										.on("end", repeat);
								})();
							}

							/*animsvg.append("text")
								.attr("x", 0)
								.attr("y", 20)
								.text(countryNameEmoji)
								.attr("class", "countryname")
								.attr("dy", "0.4em");*/
						}
						drawAnimation("HU", "HU11", "HU12", 102, "HU10", "Hungary 🇭🇺");
						drawAnimation("LT", "LT01", "LT02", 75, "LT00", "Lithuania 🇱🇹");
						drawAnimation("PL", "PL91", "PL92", 109, "PL12", "Poland 🇵🇱");


						/* Helper functions */
						function scaleLegendCells(){
							const breaks = [devLinearScale.domain()[0]].concat(devscale.domain());
							d3.selectAll(".cell").data(breaks)
								.transition().duration(2000)
								.attr("transform", (d) => `translate(${devLinearScale(d) - margin.left},0)`);
							d3.selectAll(".cell rect")
								.data(breaks)
								.transition().duration(2000)
								.attr("width", (d, i) => {
									if(i < breaks.lenght){
										return devLinearScale(breaks[i + 1]) - devLinearScale(d);
									}
									else{return width - devLinearScale(d);}
								})
							d3.selectAll(".cell text").transition().duration(2000).style("opacity", 0);
							d3.select("#average-label").transition().duration(2000)
								.attr("x", devLinearScale(100))
							d3.select("#average-mark").transition().duration(2000)
								.attr("x1", devLinearScale(100))
								.attr("x2", devLinearScale(100));
						}
						function scaleLegendCellsMap(){
							d3.selectAll(".cell")
								.transition().duration(2000)
								.attr("transform", (d,i) => `translate(${i * (width - margin.left - margin.right)/6},0)`);
							d3.selectAll(".cell rect")
								.transition().duration(2000)
								.attr("width", (width - margin.left - margin.right)/6)
							d3.selectAll(".cell text").transition().duration(2000).style("opacity", 1);
							d3.select("#average-label").transition().duration(2000)
								.attr("x", (width - margin.left - margin.right)/2 + margin.left)
							d3.select("#average-mark").transition().duration(2000)
								.attr("x1", (width - margin.left - margin.right)/2 + margin.left)
								.attr("x2", (width - margin.left - margin.right)/2 + margin.left);
						}

						//Country highlighting
						function highlightCountryRegions(countrycode, mapid){
								d3.selectAll(`#${mapid} .region:not(.${countrycode})`)
									.style("opacity", 0.1);
								d3.select(`#${mapid} .country#${countrycode}`)
									.style("filter", "url(#shadow)");
						}
						function dehighlightCountryRegions(countrycode, mapid){
							d3.selectAll(`#${mapid} .region`)
								.style("opacity", 1);
							d3.select(`#${mapid} .country#${countrycode}`)
								.style("filter", "none");
						}
						d3.selectAll(".highlight.country")
							.on("mouseover", function(){
								let countryCode = d3.select(this).attr("id");
								highlightCountryRegions(countryCode, "mapone");
							}).on("mouseout", function(){
								let countryCode = d3.select(this).attr("id");
								dehighlightCountryRegions(countryCode, "mapone");
							});

						//Region highlighting
						function getRegionsByThresholds(thlow, thhigh, measure){
							return geojsonNUTS2.features.filter(function(region){
								return region.properties[measure] < +thhigh && region.properties[measure] >= +thlow;
							}).map((region) => region.properties.NUTS_ID);
						}
						function highlightRegions(regioncodes){
							if(regioncodes.length > 1){
								d3.selectAll(".region")
									.style("opacity", 0.1);
							}

							regioncodes.forEach(function(region){
								d3.select(`.region#` + region)
									.style("opacity", 1)
									// .style("stroke", "#000000")
									.raise();
								countries.raise();
								eucaps.raise();

							});
						}
						function dehighlightRegions(){
							d3.selectAll(".region")
								.style("opacity", 1)
								.style("stroke", "#ffffff");
						}
						d3.selectAll(".highlight.region")
							.on("mouseover", function(){
								let regionCode = d3.select(this).attr("id");
								highlightRegions([regionCode]);
							}).on("mouseout", function(){
								dehighlightRegions();
							});

						d3.selectAll(".textlegend")
							.on("mouseover", function(){
								let thHigh = d3.select(this).attr("data-th-high");
								let thLow = d3.select(this).attr("data-th-low");
								let measure = d3.select(this).attr("data-measure");
								let regionsToHighlight = getRegionsByThresholds(thLow, thHigh, measure);
								highlightRegions(regionsToHighlight);
							}).on("mouseout", function(){
								dehighlightRegions();
							});

						//Highlight regions containing the country capital
						d3.selectAll(".highlight.capital-regions")
							.on("mouseover", function(){
								highlightRegions(capitalRegions);
							}).on("mouseout", function(){
								dehighlightRegions();
							});
				})
			})
		})
	});
}

export default { init, resize };
