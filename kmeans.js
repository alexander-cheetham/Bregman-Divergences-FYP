"use strict";

//Change these values to choose between random points of fixed points

async function kMeans(divname, w, h, numPoints, numClusters, maxIter,true_distr,assumed_distr,fix_points='0')
{
  const updated_centroids1 = new Array();
  const updated_centroids2 = new Array();
    //numPoints = 500;


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
    var max1 = 100;   //2
    var min2 = 0;  //-3
    var max2 = 100;   //3


    var xScale = d3.scale.linear()
        .domain([min1, max1])
        .range([0, width])
        .clamp('true');
        //.nice();

    var yScale = d3.scale.linear()
        .domain([min1, max1])
        .range([height, 0])
        .clamp('true');
        //.nice();



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
    function getRandomPoint(type, fill,alpha=1)
    {
        let x, y;
        if(true_distr==0){
          //x= Math.random() * (max1 - min1) + min1;
          //y= Math.random() * (max2 - min2) + min2;
          x= (sampleNormal(alpha[0],alpha[2]))*5+10;
          y= (sampleNormal(alpha[1],alpha[2]))*5+10;
          if(x<0){
            x=-x
          }
          if(y<0){
            y=-y
          }
        }
        if(true_distr==1){
          x= (poissonSample(alpha[0])+Math.random())* (max1 - min1)/20 + min1;
          y= (poissonSample(alpha[1])+Math.random())* (max1 - min1)/20 + min1;
        }
        return {
            x: x,
            y:y,
            params:alpha,
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
      function generatePairs() {
        let pairs = [];

        for (let k = 2; k <= 5; k++) {
          let n = Math.floor(Math.random() * (13 - 3 * k));
          let p = [];

          for (let i = 0; i < k; i++) {
            let x = n + i * 4;
            let y = n + (i + 1 + Math.floor(Math.random() * (k - 1))) * 4;

            while (y === x || Math.abs(y - x) < 4) {
              y = n + (i + 1 + Math.floor(Math.random() * (k - 1))) * 4;
            }

            // Heuristic to make the pairs more orthogonal
            let r = Math.random();
            if (r < 0.25) {
              y = x + 4;
            } else if (r < 0.5) {
              y = x - 4;
            } else if (r < 0.75) {
              y = x + 1;
            } else {
              y = x - 1;
            }

            while (y < 0 || y > 15 || Math.abs(y - x) < 4) {
              r = Math.random();
              if (r < 0.25) {
                y = x + 4;
              } else if (r < 0.5) {
                y = x - 4;
              } else if (r < 0.75) {
                y = x + 1;
              } else {
                y = x - 1;
              }
            }

            p.push([x, y]);
          }

          pairs.push(p);
        }

  return pairs;
}
function sampleNormal(mu, sigma) {
  let u1 = 1 - Math.random(); // generate a uniform random number in (0,1]
  let u2 = 1 - Math.random();
  let z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); // apply Box-Muller transform
  return mu + z0 * sigma;
}





    function initializePoints(num, type,lambda_list)
    {
        var result = [];

        for (var i = 0; i < num; i++)
        {
            var color = colors[i];
            if (type !== "centroid")
            {
                color = "#ccc";
            }
            if(true_distr==1){
              var point = getRandomPoint(type, color,lambda_list[i%lambda_list.length]);
            }
            if(true_distr==0){

              var point = getRandomPoint(type, color,lambda_list[i%lambda_list.length]);
            }
            point.id = point.type + "-" + i;
            result.push(point);

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
            if(assumed_distr==0){
              var distance = getEuclidianDistance(d, point);
            }
            if(assumed_distr==1){
              var distance = getPoissonDist(d,point);
            }

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
        let xmean,ymean;
        if(assumed_distr==0){
          xmean=d3.mean(cluster, function(d)
          {
              return d.x;
          })
          ymean = d3.mean(cluster, function(d)
          {
              return d.y;
          })
        }
        if(assumed_distr==1){
          xmean=d3.gmean(cluster, function(d)
          {
              return d.x;
          })
          ymean = d3.gmean(cluster, function(d)
          {
              return d.y;
          })
        }

        return [xmean,ymean];
    }

    /**
     * Moves the centroids to the center of their cluster.
     */
    function moveCentroids()
    {
        var u=0;
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

            if(assumed_distr==0){
              updated_centroids1.push(Array((d.x-10)/5,(d.y-10)/5,d.id));
            } else{
              updated_centroids2.push(Array(d.x/5,d.y/5,d.id));
            }
            u++
        });

    }

    /**
     * Updates the chart.
     */
    function update()
    {
        var data = points.concat(centroids);


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
				//return d.x;
				return xScale(d.x)
			})
			.attr("cy", function(d)
			{
				//return d.y;
				return yScale(d.y)
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


        // Remove old nodes
        circle.exit().remove();
        return data;
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
        let lambda_list;
        lambda_list = generatePairs()[numClusters-2]
        for (var j=0;j<lambda_list.length;j++){
          lambda_list[j].push(Math.round(4*Math.random())+1)
        }
        if (fix_points!= "0")
        {
            centroids = fix_points.c
        }
        else
        {

            centroids = initializePoints(numClusters, "centroid",lambda_list);
        }


        if (fix_points != "0")
        {
            points = fix_points.p
        }
        else
        {
            points = initializePoints(numPoints, "point",lambda_list);
        }


        // initial drawing
        update();

        var interval = setInterval(function()
        {
            if (iter < maxIter + 1)
            //if (iter < 3)
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
        return lambda_list
    }

    // Call the main function


    if (fix_points=='0'){
      let lambda_list;
      lambda_list = initialize();
      return{p:points,c:centroids,params:lambda_list}
    }
    else{
      initialize()

      if(assumed_distr==0){
        return {p:points,c:updated_centroids1}
      } else{
        return {p:points,c:updated_centroids2}
      }

    }

}
