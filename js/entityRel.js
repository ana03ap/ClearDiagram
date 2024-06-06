function init() {
    if (window.goSamples) goSamples();
    const $ = go.GraphObject.make; // for conciseness in defining templates

    myDiagram = new go.Diagram(
      'myDiagramDiv', // must name or refer to the DIV HTML element
      {
        layout: $(go.ForceDirectedLayout, { isInitial: false }),
        'undoManager.isEnabled': true,
        // use "Modern" themes from extensions/Themes
        'themeManager.themeMap': new go.Map([
          { key: 'light', value: Modern },
          { key: 'dark', value: ModernDark },
        ]),
        'themeManager.changesDivBackground': true,
        'themeManager.currentTheme': document.getElementById('theme').value,
      }
    );

    myDiagram.themeManager.set('light', {
      colors: {
        text: '#fff',
        primary: '#f7f9fc',
        green: '#62bd8e',
        blue: '#3999bf',
        purple: '#7f36b0',
        red: '#c41000',
      },
    });
    myDiagram.themeManager.set('dark', {
      colors: {
        primary: '#4a4a4a',
        green: '#429e6f',
        blue: '#3f9fc6',
        purple: '#9951c9',
        red: '#ff4d3d',
      },
    });

    // the template for each attribute in a node's array of item data
    const itemTempl = $(go.Panel,
      'Horizontal',
      { margin: new go.Margin(2, 0) },
      $(go.Shape,
        { desiredSize: new go.Size(15, 15), strokeWidth: 0, margin: new go.Margin(0, 5, 0, 0),               
              fromLinkable: true,
              toLinkable: true,
              fromSpot: go.Spot.AllSides,
              toSpot: go.Spot.AllSides, },
        new go.Binding('figure', 'figure'),
        new go.ThemeBinding('fill', 'color').ofData()
      ),
      $(go.TextBlock,
        { font: '14px sans-serif', stroke: 'white', editable: true},
        new go.Binding('text', 'name'),
        new go.Binding('font', 'iskey', (k) => (k ? 'italic 14px sans-serif' : '14px sans-serif')),
        new go.ThemeBinding('stroke', 'text')
      )
    );

    
    

    // define the Node template, representing an entity
    myDiagram.nodeTemplate = $(go.Node,
      'Auto', // the whole node panel
      {
        selectionAdorned: true,
        resizable: true,
        layoutConditions: go.LayoutConditions.Standard & ~go.LayoutConditions.NodeSized,
        fromSpot: go.Spot.LeftRightSides,
        toSpot: go.Spot.LeftRightSides,
      },
      new go.Binding('location', 'location').makeTwoWay(),
      // whenever the PanelExpanderButton changes the visible property of the "LIST" panel,
      // clear out any desiredSize set by the ResizingTool.
      new go.Binding('desiredSize', 'visible', (v) => new go.Size(NaN, NaN)).ofObject('LIST'),
      // define the node's outer shape, which will surround the Table
      $(go.Shape, 'RoundedRectangle', { stroke: '#3f9fc6', strokeWidth: 3,              
              fromLinkable: true,
              toLinkable: true,
              fromSpot: go.Spot.AllSides,
              toSpot: go.Spot.AllSides, }, new go.ThemeBinding('fill', 'primary')),
      $(go.Panel,
        'Table',
        { margin: 8, stretch: go.Stretch.Fill },
        $(go.RowColumnDefinition, { row: 0, sizing: go.Sizing.None }),
        // the table header
        $(go.TextBlock,
          {
            row: 0,
            alignment: go.Spot.Center,
            editable: true,
            margin: new go.Margin(0, 24, 0, 2), // leave room for Button
            font: 'bold 18px sans-serif',
          },
          new go.Binding('text', 'key'),
          new go.ThemeBinding('stroke', 'text')
        ),
        // the collapse/expand button
        $('PanelExpanderButton',
          'LIST', // the name of the element whose visibility this button toggles
          { row: 0, alignment: go.Spot.TopRight },
          new go.ThemeBinding('ButtonIcon.stroke', 'text')
        ),
        $(go.Panel,
          'Table',
          { name: 'LIST', row: 1, alignment: go.Spot.TopLeft },
          $(go.TextBlock,
            'Attributes',
            {
              row: 0,
              alignment: go.Spot.Left,
              margin: new go.Margin(3, 24, 3, 2),
              font: 'bold 15px sans-serif',
              editable: true,
            },
            new go.ThemeBinding('stroke', 'text')
          ),
          $('PanelExpanderButton', 'NonInherited', { row: 0, alignment: go.Spot.Right }, new go.ThemeBinding('ButtonIcon.stroke', 'text')),
          $(go.Panel,
            'Vertical',
            {
              row: 1,
              name: 'NonInherited',
              alignment: go.Spot.TopLeft,
              defaultAlignment: go.Spot.Left,
              itemTemplate: itemTempl,
            },
            new go.Binding('itemArray', 'items')
          ),
          $(go.TextBlock,
            'Inherited Attributes',
            {
              row: 2,
              alignment: go.Spot.Left,
              margin: new go.Margin(3, 24, 3, 2), // leave room for Button
              font: 'bold 15px sans-serif',
              editable: true,
            },
            new go.Binding('visible', 'inheritedItems', (arr) => Array.isArray(arr) && arr.length > 0),
            new go.ThemeBinding('stroke', 'text')
          ),
          $('PanelExpanderButton',
            'Inherited',
            { row: 2, alignment: go.Spot.Right },
            new go.Binding('visible', 'inheritedItems', (arr) => Array.isArray(arr) && arr.length > 0),
            new go.ThemeBinding('ButtonIcon.stroke', 'text')
          ),
          $(go.Panel,
            'Vertical',
            {
              row: 3,
              name: 'Inherited',
              alignment: go.Spot.TopLeft,
              defaultAlignment: go.Spot.Left,
              itemTemplate: itemTempl,
            },
            new go.Binding('itemArray', 'inheritedItems')
          ),
          
        )
      ) // end Table Panel
    ); // end Node

    // define the Link template, representing a relationship

  
    myDiagram.linkTemplate = $(go.Link, // the whole link panel
      { relinkableFrom: true, relinkableTo: true, reshapable: true,resegmentable: true },
      {
        selectionAdorned: true,
        layerName: 'Background',
        reshapable: true,
        routing: go.Routing.AvoidsNodes,
        corner: 5,
        curve: go.Curve.JumpOver,
        // mouse-overs subtly highlight links:
        mouseEnter: (e, link) => (link.findObject('HIGHLIGHT').stroke = link.diagram.themeManager.findValue('linkOver', 'colors')),
        mouseLeave: (e, link) => (link.findObject('HIGHLIGHT').stroke = 'transparent'),
        // context-click creates an editable link label
        contextClick: (e, link) => {
          e.diagram.model.commit((m) => {
            m.set(link.data, 'text', 'Label');
          });
        },
      },
      $(go.Shape, // the link shape
        { stroke: '##3f9fc6', strokeWidth: 3, fromLinkable: true, toLinkable: true, },
        new go.ThemeBinding('stroke', 'link')
      ),
      $(go.TextBlock, // the "from" label
        {
          textAlign: 'center',
          editable: true,
          font: 'bold 14px sans-serif',
          stroke: 'black',
          segmentIndex: 0,
          segmentOffset: new go.Point(NaN, NaN),
          segmentOrientation: go.Orientation.Upright,
        },
        new go.Binding('text', 'text'),
        new go.ThemeBinding('stroke', 'text')
      ),
      $(go.TextBlock, // the "to" label
        {
          textAlign: 'center',
          font: 'bold 14px sans-serif',
          stroke: 'black',
          editable: true,
          segmentIndex: -1,
          segmentOffset: new go.Point(NaN, NaN),
          segmentOrientation: go.Orientation.Upright,
        },
        new go.Binding('text', 'toText'),
        new go.ThemeBinding('stroke', 'text')
      )
    );

    // create the model for the E-R diagram
    const nodeDataArray = [
      {
        key: 'Products',
        location: new go.Point(250, 250),
        items: [
          { name: 'ProductID', iskey: true, figure: 'Decision', color: 'purple' },
          { name: 'ProductName', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'ItemDescription', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'WholesalePrice', iskey: false, figure: 'Circle', color: 'green' },
          { name: 'ProductPhoto', iskey: false, figure: 'TriangleUp', color: 'red' },
        ],
        inheritedItems: [
          { name: 'SupplierID', iskey: false, figure: 'Decision', color: 'purple' },
          { name: 'CategoryID', iskey: false, figure: 'Decision', color: 'purple' },
        ],
      },
      {
        key: 'Suppliers',
        location: new go.Point(500, 0),
        items: [
          { name: 'SupplierID', iskey: true, figure: 'Decision', color: 'purple' },
          { name: 'CompanyName', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'ContactName', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'Address', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'ShippingDistance', iskey: false, figure: 'Circle', color: 'green' },
          { name: 'Logo', iskey: false, figure: 'TriangleUp', color: 'red' },
        ],
        inheritedItems: [],
      },
      {
        key: 'Categories',
        location: new go.Point(0, 30),
        items: [
          { name: 'CategoryID', iskey: true, figure: 'Decision', color: 'purple' },
          { name: 'CategoryName', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'Description', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'Icon', iskey: false, figure: 'TriangleUp', color: 'red' },
        ],
        inheritedItems: [{ name: 'SupplierID', iskey: false, figure: 'Decision', color: 'purple' }],
      },
      {
        key: 'Order Details',
        location: new go.Point(600, 350),
        items: [
          { name: 'OrderID', iskey: true, figure: 'Decision', color: 'purple' },
          { name: 'UnitPrice', iskey: false, figure: 'Circle', color: 'green' },
          { name: 'Quantity', iskey: false, figure: 'Circle', color: 'green' },
          { name: 'Discount', iskey: false, figure: 'Circle', color: 'green' },
        ],
        inheritedItems: [{ name: 'ProductID', iskey: false, figure: 'Decision', color: 'purple' }],
      },
    ];
    const linkDataArray = [
      { from: 'Products', to: 'Suppliers', text: '0..N', toText: '1' },
      { from: 'Products', to: 'Categories', text: '0..N', toText: '1' },
      { from: 'Order Details', to: 'Products', text: '0..N', toText: '1' },
      { from: 'Categories', to: 'Suppliers', text: '0..N', toText: '1' },
    ];
    myDiagram.model = new go.GraphLinksModel({
      copiesArrays: true,
      copiesArrayObjects: true,
      nodeDataArray: nodeDataArray,
      linkDataArray: linkDataArray,
    });

    
    // Configurar la paleta
    myPalette = new go.Palette('myPaletteDiv');

    // Definir una plantilla de nodo específica para la paleta
    
    myPalette.nodeTemplate =
    $(go.Node, 'Auto',
        $(go.Shape, 'RoundedRectangle', // Cambiar la forma a un círculo
          {
            fromLinkable: true,
            toLinkable: true,
            fill: '#4a4a4a',
            
            stroke: "#3f9fc6",
            width: 200, // Reducir el tamaño del nodo
            height: 250,
          },
          new go.Binding('fill', 'color')
        ),
        $(go.Panel,
          'Table',
          { margin: 8, stretch: go.GraphObject.Fill },
          $(go.RowColumnDefinition, { row: 0, sizing: go.RowColumnDefinition.None }),
          // Cabecera de la tabla
          $(go.TextBlock,
            {
              row: 0,
              alignment: go.Spot.Center,
              editable: true,
              margin: new go.Margin(0, 24, 0, 2),
              font: 'bold 18px sans-serif',
            },
            new go.Binding('text', 'key'),
            new go.ThemeBinding('stroke', 'text')
          ),
          // Botón de colapsar/expander
          $('PanelExpanderButton',
            'LIST', // el nombre del elemento cuya visibilidad este botón alternará
            { row: 0, alignment: go.Spot.TopRight },
            new go.ThemeBinding('ButtonIcon.stroke', 'text')
          ),
          $(go.Panel,
            'Table',
            { name: 'LIST', row: 1, alignment: go.Spot.TopLeft },
            $(go.TextBlock,
              'Attributes',
              {
                row: 0,
                alignment: go.Spot.Left,
                margin: new go.Margin(3, 24, 3, 2),
                font: 'bold 15px sans-serif',
                editable: true,
                stroke: '#ffffff' // Color blanco para el texto
              },
              new go.ThemeBinding('stroke', 'text')
            ),
            $('PanelExpanderButton', 'NonInherited', { row: 0, alignment: go.Spot.Right }, new go.ThemeBinding('ButtonIcon.stroke', 'text')),
            $(go.Panel,
              'Vertical',
              {
                row: 1,
                name: 'NonInherited',
                alignment: go.Spot.TopLeft,
                defaultAlignment: go.Spot.Left,
                itemTemplate: itemTempl,
              },
              new go.Binding('itemArray', 'items')
            ),
            $(go.TextBlock,
              'Inherited Attributes',
              {
                row: 2,
                alignment: go.Spot.Left,
                margin: new go.Margin(3, 24, 3, 2),
                font: 'bold 15px sans-serif',
                editable: true,
              },
              new go.Binding('visible', 'inheritedItems', (arr) => Array.isArray(arr) && arr.length > 0),
              new go.ThemeBinding('stroke', 'text')
            ),
            $('PanelExpanderButton',
              'Inherited',
              { row: 2, alignment: go.Spot.Right },
              new go.Binding('visible', 'inheritedItems', (arr) => Array.isArray(arr) && arr.length > 0),
              new go.ThemeBinding('ButtonIcon.stroke', 'text')
            ),
            $(go.Panel,
              'Vertical',
              {
                row: 3,
                name: 'Inherited',
                alignment: go.Spot.TopLeft,
                defaultAlignment: go.Spot.Left,
                itemTemplate: itemTempl,
              },
              new go.Binding('itemArray', 'inheritedItems')
            ),
          )
        ), // termina Panel
      ); // termina Node
    
      

    // Datos de la paleta
    myPalette.model = new go.GraphLinksModel([
      {
        key: 'Class',
        items: [
          { name: 'ProductID', iskey: true, figure: 'Decision', color: 'purple' },
          { name: 'ProductName', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'ItemDescription', iskey: false, figure: 'Hexagon', color: 'blue' },
          { name: 'WholesalePrice', iskey: false, figure: 'Circle', color: 'green' },
          { name: 'ProductPhoto', iskey: false, figure: 'TriangleUp', color: 'red' },
        ],
        inheritedItems: [
          { name: 'SupplierID', iskey: false, figure: 'Decision', color: 'purple' },
          { name: 'CategoryID', iskey: false, figure: 'Decision', color: 'purple' },
        ],
      },
    ]);
  }



  function printDiagram() {
    const svgWindow = window.open();
    if (!svgWindow) return; // failure to open a new Window
    svgWindow.document.title = "Entity Relationship";
    svgWindow.document.body.style.margin = "0px";
    const printSize = new go.Size(900, 1960);
    const bnds = myDiagram.documentBounds;
    let x = bnds.x;
    let y = bnds.y;
    while (y < bnds.bottom) {
      while (x < bnds.right) {
        const svg = myDiagram.makeSvg({
          scale: 0.5,
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

  const changeTheme = () => {
    const myDiagram = go.Diagram.fromDiv('myDiagramDiv');
    if (myDiagram) {
      myDiagram.themeManager.currentTheme = document.getElementById('theme').value;
    }
  };

  window.addEventListener('DOMContentLoaded', init);