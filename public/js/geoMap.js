class GeoMap {
  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _geoData, _data) {
    this.config = {
      parentElement: _config.parentElement,
      colorScale: _config.colorScale,
      containerWidth: _config.containerWidth || 1800,
      containerHeight: _config.containerHeight || 1200,
      margin: _config.margin || { top: 0, right: 20, bottom: 500, left: 20 },
      tooltipPadding: 10
    }
    this.geoData = _geoData;
    this.data = _data;
    this.initVis();
  }

  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;

    // Calculate inner chart size. Margin specifies the space around the actual chart.
    vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
    vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
    // Define size of SVG drawing area
    vis.svg = d3.select(vis.config.parentElement).append('svg')
      .attr('width', vis.config.containerWidth)
      .attr('height', vis.config.containerHeight);

    // Append group element that will contain our actual chart 
    // and position it according to the given margin config
    vis.chart = vis.svg.append('g')
      .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

    // Defines the scale and translate of the projection so that the geometry fits within the SVG area
    // We crop Antartica because it takes up a lot of space that is not needed for our data
    vis.projection = d3.geoEquirectangular()
      .center([0, 15]) // set centre to further North
      .scale([vis.width / (2 * Math.PI)]) // scale to fit size of svg group
      .translate([vis.width / 2, vis.height / 2]); // ensure centered within svg group

    vis.geoPath = d3.geoPath().projection(vis.projection);

    vis.symbolScale = d3.scaleSqrt()
      .range([4, 25]);

    vis.updateVis();
  }

  updateVis() {
    let vis = this;
    console.log(vis.data);
    vis.symbolScale.domain(d3.extent(vis.data, d => d.population));
    vis.colorScale = d3.scaleOrdinal()
      .range(['#1916FE', '#FECF16', '#FE2316'])
    vis.data.forEach(d => {
      d.showLabel = (d.name == 'Chichen Itza') || (d.name == 'Great Wall')
    });

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    // Append world map
    const geoPath = vis.chart.selectAll('.geo-path')
      .data(topojson.feature(vis.geoData, vis.geoData.objects.countries).features)
      .join('path')
      .attr('class', 'geo-path')
      .attr('d', vis.geoPath);

    // Append country borders
    const geoBoundaryPath = vis.chart.selectAll('.geo-boundary-path')
      .data([topojson.mesh(vis.geoData, vis.geoData.objects.countries)])
      .join('path')
      .attr('class', 'geo-boundary-path')
      .attr('d', vis.geoPath);

    // Append symbols
    const geoSymbols = vis.chart.selectAll('.geo-symbol')
      .data(vis.data)
      .join('circle')
      .attr('class', 'geo-symbol')
      .attr('r', d => Math.sqrt(parseInt(d.population) * 0.000003))
      .attr('cx', d => vis.projection([d.lon, d.lat])[0])
      .attr('cy', d => vis.projection([d.lon, d.lat])[1])
      .attr('fill', function (d) {
        if (d.capital == 'primary') {
          return "#FF0000";
        } else if (d.capital != 'primary') {
          if (d.population > 9000000) {
            return "#FF9700";
          }
          else if (d.population < 9000000) {
            return "#0000FF";
          }

        }

      })
      // append("title")
      //   .text(function (d) {
      //     if (d.capital == 'primary') {
      //       if (d.population > 15000000) {
      //         return d.city;
      //       }
      //     } else if (d.capital != 'primary') {
      //       if (d.population > 15000000) {
      //         return d.city;
      //       }
      //     }
      //     // return d.city;
      //   })
      .style("font", "10px sans-serif")
      .attr("text-anchor", "middle")
      .style("opacity", 0.55);
    // Tooltip event listeners
    geoSymbols
      .on('mousemove', (event, d) => {
        d3.select('#tooltip')
          .style('display', 'block')
          .style('left', `${event.pageX + vis.config.tooltipPadding}px`)
          .style('top', `${event.pageY + vis.config.tooltipPadding}px`)
          .html(`
              <div class="tooltip-title">City: ${d.city}</div>
              <div>Population: ${d.population}<br/>Country: ${d.country}<br/>Capital: ${d.capital}</div>
            `);
      })
      .on('mouseleave', () => {
        d3.select('#tooltip').style('display', 'none');
      });

    // Append text labels to show the titles of all sights
    const geoSymbolLabels = vis.chart.selectAll('.geo-label')
      .data(vis.data)
      .join('text')
      .attr('class', 'geo-label')
      .attr('dy', '.35em')
      .attr('text-anchor', 'middle')
      .attr('x', d => vis.projection([d.lon, d.lat])[0])
      .attr('y', d => (vis.projection([d.lon, d.lat])[1] - vis.symbolScale(d.population) - 8))
      .text(function (d) {
        if (d.capital == 'primary') {
          if (d.population > 15000000) {
            return d.city;
          }
        } else if (d.capital != 'primary') {
          if (d.population > 15000000) {
            return d.city;
          }
        }
        // return d.city;
      })

    // Append text labels with the number of population for two sights (to be used as a legend) 
    // const geoSymbolVisitorLabels = vis.chart.selectAll('.geo-visitor-label')
    //   .data(vis.data)
    //   .join('text')
    //   .filter(d => d.showLabel)
    //   .attr('class', 'geo-visitor-label')
    //   .attr('dy', '.35em')
    //   .attr('text-anchor', 'middle')
    //   .attr('x', d => vis.projection([d.lon, d.lat])[0])
    //   .attr('y', d => (vis.projection([d.lon, d.lat])[1] + vis.symbolScale(d.population) + 12))
  }
}