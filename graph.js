const dims = { height: 300, width: 300, radius: 150 };
const center = { x: dims.width / 2 + 5, y: dims.height / 2 + 5 };

const svg = d3.select(".canvas")
	.append("svg")
	.attr("width", dims.width + 150)
	.attr("height", dims.height + 150);


const graph = svg.append("g")
.attr('transform', `translate(${center.x},${center.y})`); //move center of pie chart to the center of the svg container


//pie chart functions settings
const pie = d3.pie()
.sort(null)
.value(d => d.cost)

const arcPath = d3.arc()
.outerRadius(dims.radius)
.innerRadius(dims.radius / 2);

const colorScale = d3.scaleOrdinal(d3['schemeSet2']) //built-in scheme



//legend (d3-legend)
const legendGroup = svg.append("g")
.attr("transform", `translate(${dims.width + 30}, 10)`)

const legend = d3.legendColor()
.shape('circle')
.shapePadding(10)
.scale(colorScale)

//tooltips (d3-tip)
const tip = d3.tip()
.attr('class', 'tip card')
.html(d => {
  return `
  <p>${d.data.name}<br/>$${d.data.cost}</p>
  <small>Click to delete</small>`
})

graph.call(tip); 





const updateGraph = (data) => {

  colorScale.domain(data.map(d => d.name));

  legendGroup.call(legend)
  legendGroup.selectAll('text')
  .attr('fill', 'white')

  //join data with paths made with angles from pie()
  const paths = graph.selectAll("path")
  .data(pie(data));
   
  paths.exit()
  .transition().duration(800)
  .attrTween("d", arcTweenExit)
  .remove();

  paths
  // .attr("d", arcPath) //path => arcPath(path)
  .transition().duration(800)
  .attrTween("d", arcTweenUpdate)

  paths.enter()
  .append('path')
  .attr("class", "arc")
  .attr("stroke", 'white')
  .attr("stroke-width", 3)
  .attr('fill', d => colorScale(d.data.name))
  .each(function (d) { this._current = d}) //needed for Tween
  .transition().duration(800)
  .attrTween("d", arcTweenEnter) 

  graph.selectAll('path')
  .on('mouseover', (d,i,n) => {
    tip.show(d,n[i]);
    handleMouseover(d,i,n);
  })
  .on('mouseout', (d,i,n) => {
    tip.hide();
    handleMouseout(d,i,n);
  })
  .on('click', handleClick)
}


////////////////////////// DATA ///////////////////////////////
//real-time listener to db for collection changes
let currentData = [];

db.collection("expenses").onSnapshot(res => {
  res.docChanges().forEach(change => {
    const doc = {...change.doc.data(), id: change.doc.id};

    //update data array
    switch (change.type) {
      case "added":
        currentData.push(doc);
        break;
      case "modified":
        const index = currentData.findIndex(item => item.id === doc.id);
        currentData[index] = doc;
        break;
      case 'removed':
        currentData = currentData.filter(item => item.id !== doc.id);
        break;
      default:
        break;
    }

  })
  updateGraph(currentData);
})

//event handlers
const handleMouseover = (d, i, n) => {
  d3.select(n[i])
  .transition("changeFill").duration(300)
  .attr("fill", "#333");
}

const handleMouseout = (d, i, n) => {
  d3.select(n[i])
  .transition("changeFill").duration(300)
  .attr("fill", colorScale(d.data.name));
}

const handleClick = d => {
  const id = d.data.id;
  db.collection('expenses').doc(id).delete();
}


//Tweens
const arcTweenEnter = d => {
  const inter = d3.interpolate(d.endAngle, d.startAngle);

  return function (t) {
    d.startAngle = inter(t);
    return arcPath(d)
  }
}

const arcTweenExit = d => {
  const inter = d3.interpolate(d.startAngle, d.endAngle);

  return function (t) {
    d.startAngle = inter(t);
    return arcPath(d)
  }
}


function arcTweenUpdate(d) {
  const inter = d3.interpolate(this._current, d);
  console.log(this._current);
  this._current = inter(1);

  return function (t) {
    return arcPath(inter(t));
  }
}
