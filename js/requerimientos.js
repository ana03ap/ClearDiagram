function init() {
    if (window.goSamples) goSamples(); // init for these samples -- you don't need to call this

    myDiagram = new go.Diagram(
      'myDiagramDiv', // must name or refer to the DIV HTML element
      {
        'undoManager.isEnabled': true, // enable undo & redo
        'themeManager.changesDivBackground': true,
        'themeManager.currentTheme': document.getElementById('theme').value,
      }
    );

    // when the document is modified, add a "*" to the title and enable the "Save" button
    myDiagram.addDiagramListener('Modified', (e) => {
      const button = document.getElementById('SaveButton');
      if (button) button.disabled = !myDiagram.isModified;
      const idx = document.title.indexOf('*');
      if (myDiagram.isModified) {
        if (idx < 0) document.title += '*';
      } else {
        if (idx >= 0) document.title = document.title.slice(0, idx);
      }
    });

    // set up some colors/fonts for the default ('light') and dark Themes
    myDiagram.themeManager.set('light', {
      colors: {
        text: '#fff',
        start: '#064e3b',
        step: '#49939e',
        conditional: '#6a9a8a',
        end: '#7f1d1d',
        comment: '#a691cc',
        bgText: '#000',
        link: '#dcb263',
        linkOver: '#cbd5e1',
        div: '#ede9e0',
      },
    });

    myDiagram.themeManager.set('dark', {
      colors: {
        text: '#fff',
        step: '#414a8d',
        conditional: '#88afa2',
        comment: '#bfb674',
        bgText: '#fff',
        link: '#fdb71c',
        linkOver: '#475569',
        div: '#141e37',
      },
    });

    defineFigures();

    // helper definitions for node templates
    function nodeStyle(node) {
      node
        // the Node.location is at the center of each node
        .set({ locationSpot: go.Spot.Center })
        // The Node.location comes from the "loc" property of the node data,
        // converted by the Point.parse static method.
        // If the Node.location is changed, it updates the "loc" property of the node data,
        // converting back using the Point.stringify static method.
        .bindTwoWay('location', 'loc', go.Point.parse, go.Point.stringify);
    }

    function shapeStyle(shape) {
      // make the whole node shape a port
      shape.set({ strokeWidth: 0, portId: '', cursor: 'pointer' });
    }

    function textStyle(textblock) {
      textblock.set({ font: 'bold 11pt Figtree, sans-serif' }).theme('stroke', 'text');
    }

    // define the Node templates for regular nodes
    myDiagram.nodeTemplateMap.add(
      '', // the default category
      new go.Node('Auto').apply(nodeStyle).add(
        new go.Shape('Rectangle', {
          fromLinkable: true,
          toLinkable: true,
          fromSpot: go.Spot.AllSides,
          toSpot: go.Spot.AllSides,
        })
          .apply(shapeStyle)
          .theme('fill', 'step'),
        new go.TextBlock({
          margin: 12,
          maxSize: new go.Size(200, NaN),
          wrap: go.Wrap.Fit,
          editable: true,
        })
          .apply(textStyle)
          .bindTwoWay('text')
      )
    );

  
    myDiagram.nodeTemplateMap.add(
      'Comment',
      new go.Node('Auto').apply(nodeStyle).add(
        new go.Shape('File', { strokeWidth: 3 }).theme('fill', 'div').theme('stroke', 'comment'),
        new go.TextBlock({
          font: '9pt Figtree, sans-serif',
          margin: 8,
          maxSize: new go.Size(200, NaN),
          wrap: go.Wrap.Fit,
          textAlign: 'center',
          editable: true,
        })
          .theme('stroke', 'bgText')
          .bindTwoWay('text')
        // no ports, because no links are allowed to connect with a comment
      )
    );

    // replace the default Link template in the linkTemplateMap
    myDiagram.linkTemplate = new go.Link({
      routing: go.Routing.AvoidsNodes,
      curve: go.Curve.JumpOver,
      corner: 5,
      toShortLength: 4,
      relinkableFrom: true,
      relinkableTo: true,
      reshapable: true,
      resegmentable: true,
      // mouse-overs subtly highlight links:
      mouseEnter: (e, link) => (link.findObject('HIGHLIGHT').stroke = link.diagram.themeManager.findValue('linkOver', 'colors')),
      mouseLeave: (e, link) => (link.findObject('HIGHLIGHT').stroke = 'transparent'),
      // context-click creates an editable link label
      contextClick: (e, link) => {
        e.diagram.model.commit((m) => {
          m.set(link.data, 'text', 'Label');
        });
      },
    })
      .bindTwoWay('points')
      .add(
        // the highlight shape, normally transparent
        new go.Shape({
          isPanelMain: true,
          strokeWidth: 8,
          stroke: 'transparent',
          name: 'HIGHLIGHT',
        }),
        // the link path shape
        new go.Shape({ isPanelMain: true, strokeWidth: 2 }).theme('stroke', 'link'),
        // the arrowhead
        new go.Shape({ toArrow: 'standard', strokeWidth: 0, scale: 1.5 }).theme('fill', 'link'),
        // the link label
        new go.Panel('Auto', { visible: false })
          .bind('visible', 'text', (t) => typeof t === 'string' && t.length > 0) // only shown if there is text
          .add(
            // a gradient that fades into the background
            new go.Shape('Ellipse', { strokeWidth: 0 }).theme('fill', 'div', null, null, (c) => {
              return new go.Brush(go.BrushType.Radial, {
                colorStops: new go.Map([
                  { key: 0, value: c },
                  { key: 0.5, value: `${c}00` },
                ]),
              });
            }),
            new go.TextBlock({
              name: 'LABEL',
              font: '9pt Figtree, sans-serif',
              margin: 3,
              editable: true,
            })
              .theme('stroke', 'bgText')
              .bindTwoWay('text')
          )
      );

    // temporary links used by LinkingTool and RelinkingTool are also orthogonal:
    myDiagram.toolManager.linkingTool.temporaryLink.routing = go.Routing.Orthogonal;
    myDiagram.toolManager.relinkingTool.temporaryLink.routing = go.Routing.Orthogonal;

    load(); // load an initial diagram from some JSON text

    // initialize the Palette that is on the left side of the page
    myPalette = new go.Palette(
      'myPaletteDiv', // must name or refer to the DIV HTML element
      {
        nodeTemplateMap: myDiagram.nodeTemplateMap, // share the templates used by myDiagram
        themeManager: myDiagram.themeManager, // share the ThemeManager used by myDiagram
        model: new go.GraphLinksModel([
          // specify the contents of the Palette
         
          { category: 'Conditional', text: 'Requerimiento' },
          
          { category: 'Comment', text: 'Comment' },
        ]),
      }
    );
  } // end init

  // define some custom shapes for node templates
  function defineFigures() {
    go.Shape.defineFigureGenerator('Conditional', (shape, w, h) => {
      const geo = new go.Geometry();
      const fig = new go.PathFigure(w * 0.15, 0, true);
      geo.add(fig);
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, 0));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.5 * h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.85, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w * 0.15, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, 0, 0.5 * h).close());
      geo.spot1 = new go.Spot(0.15, 0);
      geo.spot2 = new go.Spot(0.85, 1);
      return geo;
    });

    // taken from https://unpkg.com/create-gojs-kit@3.0.3/dist/extensions/Figures.js:
    go.Shape.defineFigureGenerator('File', (shape, w, h) => {
      const geo = new go.Geometry();
      const fig = new go.PathFigure(0, 0, true); // starting point
      geo.add(fig);
      fig.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
      fig.add(new go.PathSegment(go.SegmentType.Line, w, h));
      fig.add(new go.PathSegment(go.SegmentType.Line, 0, h).close());
      const fig2 = new go.PathFigure(0.75 * w, 0, false);
      geo.add(fig2);
      // The Fold
      fig2.add(new go.PathSegment(go.SegmentType.Line, 0.75 * w, 0.25 * h));
      fig2.add(new go.PathSegment(go.SegmentType.Line, w, 0.25 * h));
      geo.spot1 = new go.Spot(0, 0.25);
      geo.spot2 = go.Spot.BottomRight;
      return geo;
    });
  }

  // Show the diagram's model in JSON format that the user may edit
  function save() {
    document.getElementById('mySavedModel').value = myDiagram.model.toJson();
    myDiagram.isModified = false;
  }
  function load() {
    myDiagram.model = go.Model.fromJson(document.getElementById('mySavedModel').value);
  }

  // print the diagram by opening a new window holding SVG images of the diagram contents for each page
  function printDiagram() {
    const svgWindow = window.open();
    if (!svgWindow) return; // failure to open a new Window
    svgWindow.document.title = "Modelo de requerimientos";
    svgWindow.document.body.style.margin = "0px";
    const printSize = new go.Size(900, 1960);
    const bnds = myDiagram.documentBounds;
    let x = bnds.x;
    let y = bnds.y;
    while (y < bnds.bottom) {
      while (x < bnds.right) {
        const svg = myDiagram.makeSvg({
          scale: 1.0,
          position: new go.Point(x, y),
          size: printSize,
          background: myDiagram.themeManager.findValue('div', 'colors'),
        });
        svgWindow.document.body.appendChild(svg);
        x += printSize.width;
      }
      x = bnds.x;
      y += printSize.height;
    }
    setTimeout(() => { svgWindow.print(); svgWindow.close(); }, 1);
  }

  function changeTheme() {
    const myDiagram = go.Diagram.fromDiv('myDiagramDiv');
    if (myDiagram) {
      myDiagram.themeManager.currentTheme = document.getElementById('theme').value;
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    // setTimeout only to ensure font is loaded before loading diagram
    // you may want to use an asset loading library for this
    // to keep this sample simple, it does not
    setTimeout(() => {
      init();
    }, 300);
  });