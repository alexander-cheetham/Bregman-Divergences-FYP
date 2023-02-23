"use strict";

//Change these values to choose between random points of fixed points
var fix_centroid = "no";
var fix_points = "no"

function kMeans(divname, w, h, numPoints, numClusters, maxIter)
{

    //numPoints = 500;

    //console.log(elt)

    // the current iteration
    var iter = 1;
    var centroids = [];
    var points = [];



    //var margin = {top: 30, right: 20, bottom: 80, left: 30}
    var margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
    };


    var width = w - margin.left - margin.right;
    var height = h - margin.top - margin.bottom;


    var colors = d3.scale.category10().range();


    //To set range for random values
    var min1 = 0;  //-2
    var max1 = 20;   //2
    var min2 = 0;  //-3
    var max2 = 20;   //3


    var xScale = d3.scale.linear()
        .domain([0, 20])
        .range([0, width])
        .clamp('true');
        //.nice();

    var yScale = d3.scale.linear()
        .domain([0, 20])
        .range([height, 0])
        .clamp('true');
        //.nice();

    //console.log(xScale(2))


    var svg = d3.select(divname).append("svg")
        .attr("id", "chart")
        //var svg = d3.select("#kmeans").append("svg")
        .attr("width", width + margin.left + margin.right) //The svg does not have margin
        .attr("height", height + margin.top + margin.bottom) //The svg does not have margin


    svg.append("g")
        .append("text")
        .attr("class", "label")
        .attr("transform", "translate(" + (width - margin.left - margin.right - 25) +
            "," + (height + margin.top + margin.bottom - 10) + ")")
        .text("Initialize");


    var group = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")



    /**
     * Computes the euclidian distance between two points.
     */
    function getEuclidianDistance(a, b)
    {
        var dx = b.x - a.x,
            dy = b.y - a.y;
        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }
    function getPoissonDist(a, b){
      var dx = a.x*Math.log(a.x/b.x)-(a.x-b.x);
      var dy = a.y*Math.log(a.y/b.y)-(a.y-b.y);
      return Math.sqrt(dx+dy);
    }

    /**
     * Returns a point with the specified type and fill color and with random
     * x,y-coordinates.
     */
    function getRandomPoint(type, fill,distr,alpha=1)
    {
        return {
            //x: Math.round(Math.random() * width),
            //y: Math.round(Math.random() * height),
            //x: Math.round(Math.random() * 2),
            //y: Math.round(Math.random() * 2),
            x: (poissonSample(alpha)+Math.random())* (max1 - min1)/20 + min1,
            y: (poissonSample(alpha)+Math.random())* (max1 - min1)/20 + min1,
            //x: Math.random() * (max1 - min1) + min1,
            //y: Math.random() * (max2 - min2) + min2,

            type: type,
            fill: fill,
        };

    }

    function poissonSample (alpha) {
      var x = 0
      var u = Math.random()
      var p = u
      while (p >= Math.pow(Math.E,-alpha)){
        x=x+1
        p=p*Math.random()
        if(p<Math.pow(Math.E,-alpha)){
          break
        }
      }
      return  x ;
    }

    /**
     * Generates a specified number of random points of the specified type.
     */
    function initializePoints(num, type)
    {
        var result = [];
        for (var i = 0; i < num; i++)
        {
            var color = colors[i];
            if (type !== "centroid")
            {
                color = "#ccc";
            }
            if(i%2==0){
              var point = getRandomPoint(type, color,'poisson');
            }
            else{
              var point = getRandomPoint(type, color,'poisson',10);
            }
            point.id = point.type + "-" + i;
            result.push(point);

            //console.log(point.x, point.y,point.type,point.fill)
            //console.log(point)
            //console.log(result)
        }
        return result;
    }

    /**
     * Find the centroid that is closest to the specified point.
     */
    function findClosestCentroid(point)
    {
        var closest = {
            i: -1,
            distance: width * 2
        };
        centroids.forEach(function(d, i)
        {

            //var distance = getEuclidianDistance(d, point);
            var distance = getPoissonDist(d,point);
            // Only update when the centroid is closer
            if (distance < closest.distance)
            {
                closest.i = i;
                closest.distance = distance;
            }
        });
        return (centroids[closest.i]);
    }

    /**
     * All points assume the color of the closest centroid.
     */
    function colorizePoints()
    {
        points.forEach(function(d)
        {
            var closest = findClosestCentroid(d);
            d.fill = closest.fill;
        });
    }
    d3.gmean = function(data, value = d => d) {
      const r = 64;
      const K = 2 ** r;
      const K1 = 2 ** -r;
      let p = 1; // product
      let n = 0; // count
      let s = 1; // sign
      let k = 0; // track exponent to prevent under/overflows
      for (let i = 0; i < data.length; i++) {
        const v = value(data[i]);
        if (+v === +v) {
          n++;
          s = Math.sign(v);
          if (s === 0) return 0;
          p *= Math.abs(v);
          while (p > K) (p *= K1), ++k;
          while (p < K1) (p *= K), --k;
        }
      }
      return n ? s * 2 ** ((Math.log2(p) + k * r) / n) : NaN;
    };
    /**
     * Computes the center of the cluster by taking the mean of the x and y
     * coordinates.
     */
    function computeClusterCenter(cluster)
    {
        //console.log(cluster)
        return [
            d3.gmean(cluster, function(d)
            {
                return d.x;
            }),
            d3.gmean(cluster, function(d)
            {
                return d.y;
            })
        ];
    }

    /**
     * Moves the centroids to the center of their cluster.
     */
    function moveCentroids()
    {
        centroids.forEach(function(d)
        {
            // Get clusters based on their fill color
            var cluster = points.filter(function(e)
            {
                return e.fill === d.fill;
            });
            // Compute the cluster centers
            var center = computeClusterCenter(cluster);
            // Move the centroid
            d.x = center[0];
            d.y = center[1];

            //console.log(cluster[0])
            console.log(d)
            //console.log(d.x,d.y,d.id)
        });
    }

    /**
     * Updates the chart.
     */
    function update()
    {
        var data = points.concat(centroids);

        //console.log(points)

        // The data join
        var circle = group.selectAll("circle")
            .data(data);

        // Create new elements as needed
        circle.enter().append("circle")
            .attr("id", function(d)
            {
                return d.id;
            })
            .attr("class", function(d)
            {
                return d.type;
            })
            //.attr("r", 4);
            .attr("r", function(d,i)
            	{
            		if (d.type == "centroid")
            		{
            			return 4;
            		}
            		else
            		{
            			return 3;s
            		}
            	});

        // Update old elements as needed
		circle
			.transition()
			.delay(10).duration(200)
			//.ease('bounce')
			.attr("cx", function(d)
			{
        //console.log(d.x,xScale(d.x*10000))
				//return d.x;
				return xScale(d.x)
					//return console.log(xScale(d.x), d.x), xScale(d.x)
			})
			.attr("cy", function(d)
			{
				//return d.y;
				return yScale(d.y)
					//return console.log(yScale(d.y)), yScale(d.y)
			})
			// .style("fill", function(d)
			// {
			//     return d.fill;
			// });
			.style("fill", function(d, i)
			{
				if (d.type == "centroid")
				{
					return "white";
				}
				else
				{
					return d.fill;
				}
			});

        //console.log(data)

        // Remove old nodes
        circle.exit().remove();
    }


    /**
     * Updates the text in the label.
     */
    function setText(text)
    {
        svg.selectAll(".label").text(text);
    }

    /**
     * Executes one iteration of the algorithm:
     * - Fill the points with the color of the closest centroid (this makes it
     *   part of its cluster)
     * - Move the centroids to the center of their cluster.
     */
    function iterate()
    {

        // Update label
        setText("Iteration " + iter + " of " + maxIter);

        // Colorize the points
        colorizePoints();

        // Move the centroids
        moveCentroids();

        // Update the chart
        update();
    }

    /**
     * The main function initializes the algorithm and calls an iteration every
     * two seconds.
     */
    function initialize()
    {

        //var fix_centroid = "yes";
        //var fix_points = "yes"

        // Initialize random points and centroids
        //centroids = initializePoints(numClusters, "centroid");
        //points = initializePoints(numPoints, "point");


        if (fix_centroid == "yes")
        {
            centroids = [
            {
                fill: "#1f77b4", //blue
                id: "centroid-0",
                type: "centroid",
                x: 2,   //2   3.8 crash
                y: 1
            },
            {
                fill: "#ff7f0e", //orange
                id: "centroid-1",
                type: "centroid",
                x: -3,
                y: 2
            },
            {
                fill: "#2ca02c", //green
                id: "centroid-2",
                type: "centroid",
                x: -0.5,
                y: -3.5
            },
            {
                fill: "#d62728", //red
                id: "centroid-3",
                type: "centroid",
                x: 0,
                y: -1
            }]
        }
        else
        {
            centroids = initializePoints(numClusters, "centroid");
        }


        if (fix_points == "yes")
        {
            points = [
                {
                    fill: "#ccc",
                    id: "point-0",
                    type: "point",
                    x: 0.204,
                    y: 2.939
                },
                {
                    fill: "#ccc",
                    id: "point-1",
                    type: "point",
                    x: -1.6989,
                    y: 0
                },
                {
                    fill: "#ccc",
                    id: "point-2",
                    type: "point",
                    x: -2.1549,
                    y: -3
                },
                {
                    fill: "#ccc",
                    id: "point-3",
                    type: "point",
                    x: 1,
                    y: -2.301
                },
                {
                    fill: "#ccc",
                    id: "point-4",
                    type: "point",
                    x: -1,
                    y: 2
                },
                {
                    fill: "#ccc",
                    id: "point-5",
                    type: "point",
                    x: 0,
                    y: 2.929
                },
                {
                    fill: "#ccc",
                    id: "point-6",
                    type: "point",
                    x: 0.301,
                    y: 2.903
                },
                {
                    fill: "#ccc",
                    id: "point-7",
                    type: "point",
                    x: -1,
                    y: 0.4771
                },
                {
                    fill: "#ccc",
                    id: "point-8",
                    type: "point",
                    x: -0.3979,
                    y: 2.929
                },
                {
                    fill: "#ccc",
                    id: "point-9",
                    type: "point",
                    x: -2.096,
                    y: 0
                },
                {
                    fill: "#ccc",
                    id: "point-10",
                    type: "point",
                    x: -1.0457,
                    y: 1
                },
                {
                    fill: "#ccc",
                    id: "point-11",
                    type: "point",
                    x: -3,
                    y: -2.1549
                },
                {
                    fill: "#ccc",
                    id: "point-12",
                    type: "point",
                    x: -3,
                    y: -1.5228
                },

                {
                    fill: "#ccc",
                    id: "point-13",
                    type: "point",
                    x: -1,
                    y: 0
                },
                {
                    fill: "#ccc",
                    id: "point-14",
                    type: "point",
                    x: 1,
                    y: -3
                },
                {
                    fill: "#ccc",
                    id: "point-15",
                    type: "point",
                    x: 1.602,
                    y: -2.301
                }
            ]
        }
        else
        {
            points = initializePoints(numPoints, "point");
            //console.log(points)
        }



        //centroids[0]

        //console.log(centroids[0],centroids[1])
        //console.log(centroids)
        //console.log(points)

        // initial drawing
        update();

        var interval = setInterval(function()
        {
            if (iter < maxIter + 1)
            {
                iterate();
                iter++;
            }
            else
            {
                clearInterval(interval);
                setText("Done");
            }
        }, 7.5 * 50); //time to start iterations
    }

    // Call the main function
    initialize();
}
