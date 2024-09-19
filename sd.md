WORKING RULES

1. Coding will be in Visual Studio Live Share, under control of IMTAKI Company...
   localhost will ve shared and files will be shared to developer so they will able to write down coding...

2. Working times is between 9am and 9pm for Turkish Time...

Tasks for that project

1- a parametric 2D canas drawing Project...
2- there will be a area at left side and the inputs will come from there...(This inputs will be flexable my customer can add new parameters here)...
3- İnside drawing we  will do able to those :
        -- Circle: Draws a circle by specifying a center point and a radius.
        -- Arc: Creates an arc, which is a portion of a circle.
        -- Rectangle: Draws a rectangle by specifying two corner points.
        -- Ellipse: Draws an ellipse or elliptical arcs.
        -- Spline: Creates smooth curves that pass through or near a set of points.
        Hatch: Fills a bounded area with a pattern, solid color, or gradient.
        --Text: Adds text to your drawing, either as single-line text or multiline text (paragraphs).
        --Dim (Dimension): Adds dimension lines to show the size or distance of objects in your drawing.
        Trim: Trims or cuts objects at their intersections or along a specified boundary.
        Extend: Extends objects to meet the edges of other objects.
        Offset: Creates parallel copies of objects at a specified distance.
        --Mirror: Creates a mirror image of an object across a specified line.
        Array: Copies objects in a pattern, such as in a circular or rectangular arrangement.
        --Fillet: Rounds the corners where two lines meet.
        Chamfer: Bevels the corners where two lines meet, creating a sloped edge.

4- at last we will be able to connect our left side inputs to our cnvas drawings and whenever I change the parameters whole canvas will change as ı wanted as parameters...

the function will start like that: 

const setDrawPolygons = (CONTENT) => {
  const {
    polygons,
    hoveredPolygonIndex,
    selectedItem,
    zoomLevel,
    zoomCenter,
    ctx,
  } = CONTENT;


  and polygons is an array like below : 

  
  [
    {
        "name": "polygon1",
        "closed": false,
        "points": [
            {
                "x": 213.23,
                "y": 500,
                "formulas": {
                    "y": {
                        "datatype": "IamFormula",
                        "place": "y",
                        "KEYID": "1afnw5r7n5MQRHSGQG1R"
                    },
                    "x": {
                        "datatype": "IamFormula",
                        "place": "y",
                        "KEYID": "1afnw5r7n5MQRHSGQG1R"
                    }
                }
            },
            {
                "x": 451.01,
                "y": 500,
                "formulas": {
                    "y": {
                        "datatype": "IamFormula", // means you cant change that point "y" coordinate cause it connected to a formula... so when try to drag point y coordinte doesnt change...
                        "place": "y",
                        "KEYID": "tX7wHYEL3TZE4T62ifwQ"
                    }
                }
            },
            {
                "x": 746.56,
                "y": 115.65
            },
            {
                "x": 292.12,
                "y": 148.99
            }
        ],
        "closeButton": {
            "x": 302.12,
            "y": 158.99,
            "width": 50,
            "height": 20
        }
    }
]

example 1 for selectedItem:
selectedItem: {
    "type": "Point",
    "myPolygonIndex": 0,
    "pointIndex": 3
}

example 2 for selectedItem:
selectedItem:{
    "type": "line",
    "myPolygonIndex": 0,
    "lineIndex": 3
}


updateLeftpolygons fnucsins is below 

  updateLeftpolygons = (polygons, savePoints, selectedItem) => {
    const UPDATE = {};


    if (savePoints) UPDATE.savePoints = savePoints;
    if (selectedItem) {
      if(selectedItem == "FALSE"){
        UPDATE.selectedItem = false;
      }else{
        UPDATE.selectedItem = selectedItem;
      }

    }
      
    if (polygons) UPDATE.polygons = polygons;

    this.setState(UPDATE);
  };


Mydrawings compoennt is below : 


<Suspense fallback={<div></div>}>
    <Mydrawings
        ref={DrawingAreaRef}
        settings={{
            polygons,
            selectedItem,
            updateLeftpolygons,
        }}
    />
    </Suspense>