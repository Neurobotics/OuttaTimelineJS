function setDefaultSetting(recipient, settings, name, defaultValue)
{
	recipient[name] = (typeof(settings) === 'undefined' || !settings.hasOwnProperty(name)) ? defaultValue : settings[name];
}

function singleLine(ctx, x1, y1, x2, y2)
{
	ctx.moveTo(x1+0.5, y1+0.5);
	ctx.lineTo(x2+0.5, y2+0.5);
}

function inRange(x, y, x1, y1, x2, y2)
{
	return (x >= x1 && x <= x2 && y >= y1 && y <= y2);
}

function OuttaTimelineTrack(settings = new Object())
{
	var listeners = Object();   //Matrix of event/callbacks

    //Add listener
    this.on = function(evt, callback) {
        //console.log("Listener added: " + evt);

        if (!listeners.hasOwnProperty(evt))
            listeners[evt] = Array();

        listeners[evt].push(callback);
    }

    //Call listeners
    this.trigger = function(evt, params) {
        //console.log("trigger called " + evt);
        //console.dir(listeners);

        if (evt in listeners) {
            callbacks = listeners[evt];
            //Call all callbacks with the params
            for (var x in callbacks){
                callbacks[x](params);
            }
        } else {
            //console.log("No listeners found for " + evt);
        }
    }

	setDefaultSetting(this, settings, 'title', "");
	setDefaultSetting(this, settings, 'color', "#B30");

	setDefaultSetting(this, settings, 'min', 0);
	setDefaultSetting(this, settings, 'max', 100);
	setDefaultSetting(this, settings, 'def', 0);
	setDefaultSetting(this, settings, 'points', new Array());
	setDefaultSetting(this, settings, 'lineStyle', 2);
	setDefaultSetting(this, settings, 'dimension', "");
	setDefaultSetting(this, settings, 'knobRadius', 5);

	this.checkOrder();

	this.range = this.max - this.min;

	this.scaleY = 0;
	this.baseY = 0;
	this.height = 0;
	this.width = 0;
	this.baseX = 0;
	this.scaleX = 0;

	this.ctx = null;
	this.canvas = null;
	this.canvasElement = null;
	this.canvasId = '';

	this.gridCtx = null;
	this.gridCanvas = null;
	this.gridCanvasElement = null;
	this.gridCanvasId = '';

	this.boundingTopX = 0;
	this.boundingTopY = 0;
	this.boundingBottomX = 0;
	this.boundingBottomY = 0;
	


	this.timeline = null;

	this.index = 0;

	this.knobPoints = new Array();
}

OuttaTimelineTrack.prototype.callDataUpdated = function()
{
	//TODO
	//console.log("Data updated");
	this.trigger('dataChanged');
}

OuttaTimelineTrack.prototype.checkOrder = function()
{
	this.points.sort(function(a,b) {return a[0]-b[0];});
}

OuttaTimelineTrack.prototype.addPoint = function(x, y)
{
	this.points.push([x, y]);
	this.checkOrder();
	this.callDataUpdated();
}

OuttaTimelineTrack.prototype.removePointAt = function(index)
{
	if (index < 0 || index >= this.points.length) return;

	this.points.splice(index, 1);
	this.callDataUpdated();
}

OuttaTimelineTrack.prototype.movePoint = function(index, x, y)
{
	if (index < 0 || index >= this.points.length) return;

	this.points[index][0] = x;
	this.points[index][1] = y;
	this.callDataUpdated();
}

OuttaTimelineTrack.prototype.getVisualY = function(y_value)
{
	var v = this.baseY + this.height - this.height*(y_value - this.min)/this.range;
	return v;
}

OuttaTimelineTrack.prototype.getRealValueFromY = function(y_global_pos)
{
	var v = this.min - this.range*(y_global_pos - this.baseY - this.height)/this.height;
	return v;
}


OuttaTimelineTrack.prototype.getCanvas = function()
{
	if (this.canvas == null) this.canvas = $("#"+this.canvasId);  return this.canvas;
}

OuttaTimelineTrack.prototype.getCanvasElement = function()
{
	if (this.canvasElement == null) this.canvasElement = document.getElementById(this.canvasId); return this.canvasElement;
}

OuttaTimelineTrack.prototype.getCanvasContext = function()
{
	if (this.ctx == null && this.canvasElement != null) this.ctx = this.canvasElement.getContext("2d"); return this.ctx;
}

OuttaTimelineTrack.prototype.getGridCanvas = function()
{
	if (this.gridCanvas == null) this.gridCanvas = $("#"+this.gridCanvasId); return this.gridCanvas;
}

OuttaTimelineTrack.prototype.getGridCanvasElement = function()
{
	if (this.gridCanvasElement == null) this.gridCanvasElement = document.getElementById(this.gridCanvasId); return this.gridCanvasElement;
}

OuttaTimelineTrack.prototype.getGridCanvasContext = function()
{
	if (this.gridCtx == null && this.getGridCanvasElement() != null) this.gridCtx = this.gridCanvasElement.getContext("2d"); return this.gridCtx;
}

OuttaTimelineTrack.prototype.toSaveableObject = function()
{
	var j = new Object();
	j.min = this.min;
	j.max = this.max;
	j.def = this.def;
	j.title = this.title;
	j.points = this.points;
	j.color = this.color;
	//console.log(JSON.stringify(j));
	return j;
}

function OuttaTimeline(elementId, tracks = new Array(), settings = new Array())
{
	var that = this;

	var listeners = Object();   //Matrix of event/callbacks

	//TODO: switch to classes instead of prototype

    //Add listener
    this.on = function(evt, callback) {
        //console.log("Listener added: " + evt);

        if (!listeners.hasOwnProperty(evt))
            listeners[evt] = Array();

        listeners[evt].push(callback);
    }

    //Call listeners
    this.trigger = function(evt, params) {
        //console.log("trigger called " + evt);
        //console.dir(listeners);

        if (evt in listeners) {
            callbacks = listeners[evt];
            //Call all callbacks with the params
            for (var x in callbacks){
                callbacks[x](params);
            }
        } else {
            //console.log("No listeners found for " + evt);
        }

    }

	this.elementId = elementId;
	setDefaultSetting(this, settings, 'trackHeight', 100);
	setDefaultSetting(this, settings, 'trackSpacing', 10);

	setDefaultSetting(this, settings, 'scaleX', 50);
	setDefaultSetting(this, settings, 'scaleXsubdiv', 5);
	setDefaultSetting(this, settings, 'background', "#333");
	setDefaultSetting(this, settings, 'textColor', "#FFF");
	setDefaultSetting(this, settings, 'gridColor', "#777");
	setDefaultSetting(this, settings, 'gridTextColor', "#AAA");
	setDefaultSetting(this, settings, 'gridSubColor', "#555");
	setDefaultSetting(this, settings, 'gridSubDash', [2, 2]);
	setDefaultSetting(this, settings, 'fontSizePx', 14);
	setDefaultSetting(this, settings, 'fontFamily', "Courier New");
	setDefaultSetting(this, settings, 'fontSizeGridPx', Math.floor(this.trackSpacing*0.9));
	setDefaultSetting(this, settings, 'fontFamilyGrid', "Courier New");

	this.font = "";
	this.gridFont = "";
	this.updateFont();

	this.tracks = new Array();
	
	this.headerHeight = 10;
	this.headerWidth = 0;

	this.isMouseOver = false;
	this.isMouseDown = false;
	this.keyControl = false;
	this.keyAlt = false;
	this.keyShift = false;
	this.cursorPos = [0,0];

	this.knobDragging = false;
	this.knobTrackIndex = -1;
	this.knobStartPos = [0,0];
	this.knobIndex = -1;
	this.knobXlimit = [0, 0];
	this.knobYlimit = [0, 0];
	
	this.time = 0;

	this.element = $("#"+this.elementId);
	
	this.element.html("");

	this.element.on('resize', function()
	{
		that.redraw();
	});

	$(document).keydown(function (e)
	{
		if (that.isMouseOver)
		{
			if (e.key == "Control")
			{
				that.keyControl = true;
				that.drawOverlay();
			}
			else if (e.key == "Alt")
			{
				that.keyAlt = true;
				that.drawOverlay();
			}
			else if (e.key == "Shift")
			{
				that.keyShift = true;

				if (that.knobDragging)
				{
					that.performKnobDragging(that);
					that.drawOverlay();
				}
			}
		}
	});

	$(document).keyup(function (e)
	{
		if (that.isMouseOver)
		{
			if (e.key == "Control")
			{
				that.keyControl = false;
				that.drawOverlay();
			}
			else if (e.key == "Alt")
			{
				that.keyAlt = false;
				that.drawOverlay();
			}
			else if (e.key == "Shift")
			{
				that.keyShift = false;

				if (that.knobDragging)
				{
					that.performKnobDragging(that);
					that.drawOverlay();
				}
			}
		}
	});

	this.setTracks(tracks);

	//TODO: double click to add or remove point
}

OuttaTimeline.prototype.setTime = function(time)
{
	if (time < 0) time = 0;
	this.time = time;
	this.drawOverlay();
}

OuttaTimeline.prototype.setTracks = function(tracks)
{
	this.tracks = new Array();
	var that = this;
	if (Array.isArray(tracks))
	{
		for (var i = 0; i<tracks.length; i++)
		{
			var track = tracks[i];

			if (typeof(track) !== 'undefined')
			{
				this.tracks[this.tracks.length] = track;
				track.on('dataChanged', function() { that.trigger('dataChanged'); });
			}
		}
	}

	this.trackCount = this.tracks.length;
	
	this.reload();
}

OuttaTimeline.prototype.reload = function()
{
	if (this.overlayCanvas != null) this.overlayCanvas.off();
	
	var that = this;
	
	this.element.css("min-height", this.height()+ "px");
	this.element.css("background", "#333");


	var html = '<style>#'+this.elementId+' canvas { position: absolute; top: 0; width: 100%; left: 0; height: 100%; }'+
	' #'+this.elementId+' canvas.overlay { pointer-events: none; } .pointer { cursor: pointer; } </style>'+
	'<canvas id="'+this.elementId+'-grid"></canvas>';

	for (var i =0;i<this.tracks.length; i++)
	{
		this.tracks[i].index = i;

		var trackCanvasId = this.elementId+'-track-'+i;
		this.tracks[i].canvasId = trackCanvasId;

		var trackGridCanvasId = this.elementId+'-track-grid-'+i;
		this.tracks[i].gridCanvasId = trackGridCanvasId;

		html += '<canvas id="'+trackGridCanvasId+'" class="overlay"></canvas>';
		html += '<canvas id="'+trackCanvasId+'" class="overlay"></canvas>';
	}

	html += '<canvas id="'+this.elementId+'-overlay"></canvas>';

	this.element.html(html);

	this.gridCanvasId = this.elementId+'-grid';
	this.gridCanvas = $("#"+this.gridCanvasId);
	this.gridElement = document.getElementById(this.gridCanvasId);
	this.gridCanvasContext = this.gridElement.getContext("2d");

	this.overlayCanvas = $("#"+this.elementId+"-overlay");
	this.overlayElement = document.getElementById(this.elementId+"-overlay");
	this.overlayContext = this.overlayElement.getContext("2d");

	this.redraw();


	this.element.on('resize', function()
	{
		that.redraw();
	});

	this.overlayCanvas.mouseenter(function (e)
	{
		that.isMouseOver = true;
	});

	this.overlayCanvas.mouseleave(function (e)
	{
		that.isMouseOver = false;
	});

	this.overlayCanvas.mousemove(function (e)
	{
		var c = that.overlayCanvas;
		var off = c.offset();
		var mx = e.pageX - off.left;
		var my = e.pageY - off.top;

		var pointer = (mx > 10 && mx < 200 && my > 10 && my < 100);

		that.cursorPos = [mx, my];

		that.performKnobDragging(that);

		that.drawOverlay();
	});

	this.overlayCanvas.mousedown(function (e)
	{
		if (that.knobTrackIndex >= 0 && that.knobIndex >= 0)
		{
			var t = that.tracks[that.knobTrackIndex];

			var min_x = 0;
			var max_x = t.width/t.scaleX;

			var min_y = t.min;
			var max_y = t.max;

			if (that.knobIndex + 1 < t.points.length)
			{
				var p_right = t.points[that.knobIndex+1];
				max_x = p_right[0]-0.01;
			}

			if (that.knobIndex - 1 >= 0)
			{
				var p_left = t.points[that.knobIndex-1];
				min_x = p_left[0]+0.01;
			}

			that.knobXlimit = [min_x, max_x];
			that.knobYlimit = [min_y, max_y];

			that.knobDragging = true;
		}
		else
		{
			that.knobDragging = false;
		}
	});

	this.overlayCanvas.mouseup(function (e)
	{
		if (that.knobDragging && that.knobTrackIndex >= 0 && that.knobIndex >= 0)
		{
			var t = that.tracks[that.knobTrackIndex];
			var p = t.points[that.knobIndex];
			t.movePoint(that.knobIndex, p[0], p[1]);
		}
		that.knobDragging = false;

		if (that.keyControl || that.keyAlt)
		{
			var mx = that.cursorPos[0];
			var my = that.cursorPos[1];

			for (var i = 0; i<that.tracks.length; i++)
			{
				var t = that.tracks[i];

				if (inRange(mx, my, t.boundingTopX, t.boundingTopY, t.boundingBottomX, t.boundingBottomY))
				{
					if (that.keyControl)
					{
						var x = (mx - t.boundingTopX)/t.scaleX;
						var y = t.getRealValueFromY(my)

						t.addPoint(x, y);
					}
					else if (that.keyAlt)
					{
						if (that.knobTrackIndex >= 0 && that.knobIndex >= 0)
						{
							that.tracks[that.knobTrackIndex].removePointAt(that.knobIndex);
						}
					}
					that.drawTrack(i);

					break;
				}
			}
		}

	});
}

OuttaTimeline.prototype.toSaveableObject = function()
{
	var res = new Object();
	res.tracks = new Array();

	for (var i = 0; i<this.tracks.length; i++)
	{
		res.tracks.push(this.tracks[i].toSaveableObject());
	}

	console.log(JSON.stringify(res));
	return res;
}

OuttaTimeline.prototype.setFontSize = function(font_size_px)
{
	this.fontSizePx = font_size_px;
	this.updateFont();
	this.redraw();
}

OuttaTimeline.prototype.setFontFamily = function(font_family)
{
	this.fontFamily = font_family;
	this.updateFont();
	this.redraw();
}

OuttaTimeline.prototype.updateFont = function()
{
	this.font = this.fontSizePx + "px " + this.fontFamily + "";
	this.gridFont = this.fontSizeGridPx + "px " + this.fontFamilyGrid + "";
}

OuttaTimeline.prototype.performKnobDragging = function(that)
{
	if (that.knobDragging && that.knobTrackIndex >= 0 && that.knobIndex >= 0)
	{
		var deltax = that.cursorPos[0] - that.knobStartPos[0];
		var deltay = that.cursorPos[1] - that.knobStartPos[1];

		var t = that.tracks[that.knobTrackIndex];

		var p_orig = that.knobOriginalPoint;
		var p = t.points[that.knobIndex];

		var new_x = p_orig[0] + (deltax)/t.scaleX;
		var new_y  = p_orig[1] + (-deltay)/t.scaleY;

		if (new_y > that.knobYlimit[1])
		{
			new_y = that.knobYlimit[1];
		}
		else if (new_y < that.knobYlimit[0])
		{
			new_y = that.knobYlimit[0];
		}

		if (new_x > that.knobXlimit[1])
		{
			new_x = that.knobXlimit[1];
		}
		else if (new_x < that.knobXlimit[0])
		{
			new_x = that.knobXlimit[0];
		}

		if (that.keyShift)
		{
			new_x = p_orig[0];
		}

		p[0] = new_x;
		p[1] = new_y;

		that.drawTrack(that.knobTrackIndex);
	}
}

OuttaTimeline.prototype.width = function()
{
	return this.element.width();
}

OuttaTimeline.prototype.height = function()
{
	return this.trackCount*this.trackHeight + (this.trackCount+1)*this.trackSpacing;
}

OuttaTimeline.prototype.redraw = function()
{
	this.drawGrid();

	var w = this.width();
	var h = this.height();
	var th = this.trackHeight;
	var ts = this.trackSpacing;

	var oc = this.overlayElement;
	var octx = this.overlayContext;

	this.updateFont();

	oc.width = w;
	oc.height = h;
	octx.width = w;
	octx.height = h;
	octx.font = this.font;

	var maxHeaderWidth = 0;

	for (var i = 0; i<this.count(); i++)
	{
		var t = this.tracks[i];
		var hw = octx.measureText(t.title);
		if (hw.width > maxHeaderWidth)
		{
			maxHeaderWidth = hw.width;
		}
	}

	maxHeaderWidth += ts;

	this.headerWidth = maxHeaderWidth;


	for (var i = 0; i<this.count(); i++)
	{
		var t = this.tracks[i];

		var c = t.getCanvasElement();
		var ctx = t.getCanvasContext();

		var gc = t.getGridCanvasElement();
		var gctx = t.getGridCanvasContext();

		c.width = w;
		c.height = h;

		ctx.width = w;
		ctx.height = h;
		ctx.font = this.font;

		gc.width = w;
		gc.height = h;

		gctx.width = w;
		gctx.height = h;
		gctx.font = this.font;

		t.scaleY = th/t.range;
		t.baseY = ts + i*(th + ts);
		t.baseX = maxHeaderWidth + ts;
		t.width = w - 2*ts - this.headerWidth;
		t.height = th;
		t.scaleX = this.scaleX;

		t.boundingTopX = maxHeaderWidth +ts;
		t.boundingTopY = t.baseY;
		t.boundingBottomX = t.boundingTopX+t.width;
		t.boundingBottomY = t.baseY + th;

		this.drawTrackGrid(i);
		this.drawTrack(i);
	}

	this.drawOverlay();
}

OuttaTimeline.prototype.drawTrackGrid = function(index)
{
	if (index < 0 || index >= this.count()) return;

	var track = this.tracks[index];	if (typeof(track) === 'undefined') return;

	var ctx = track.getGridCanvasContext();	if (ctx == null) return;

	var w = this.width();
	var h = this.height();
	var th = track.height;
	var tw = track.width;
	var tx = track.baseX;
	var ty = track.baseY;

	ctx.clearRect(0,0,w,h);

	ctx.fillStyle = this.textColor;
	ctx.font = this.font;
	ctx.fillText(track.title, this.trackSpacing, ty+(th/2)+(this.fontSizePx*0.25));

	var scaleX = this.scaleX;
	var scaleY = 50;
	var scaleSubX = this['scaleXsubdiv'];
	var scaleSubY = 5;
	var scaleSubStepX = scaleX/scaleSubX;
	var scaleSubStepY = scaleY/scaleSubY;
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = this.gridSubColor;
	ctx.setLineDash(this.gridSubDash);

	for (var i=scaleSubStepX; i<tw; i+=scaleSubStepX)
	{
		singleLine(ctx, tx+i, ty, tx+i, ty + th);
	}

	for (var i=scaleSubStepY; i<th; i+=scaleSubStepY)
	{
		singleLine(ctx, track.baseX, track.baseY+i, tw+track.baseX, track.baseY + i);
	}
	ctx.stroke();

	ctx.beginPath();
	ctx.setLineDash([]);
	ctx.lineWidth = 1;
	ctx.strokeStyle = this.gridColor;
	ctx.fillStyle = this.gridTextColor;
	ctx.font = this.gridFont;

	for (var i=0; i<tw; i+=scaleX)
	{
		singleLine(ctx, tx+i, ty, tx+i, ty + th + this.fontSizeGridPx/2);
		ctx.fillText(Math.floor(i/scaleX), tx+i+2, ty+th+this.fontSizeGridPx);
		
	}
	
	singleLine(ctx, tx-3, ty, tx, ty);
	singleLine(ctx, tx-3, ty+th, tx, ty+th);
	
	
	ctx.stroke();
	
	var maxStr = Math.floor(track.max)+track.dimension;
	var minStr = Math.floor(track.min)+track.dimension;
	
	ctx.fillText(maxStr, tx -1- ctx.measureText(maxStr).width, ty+this.fontSizeGridPx+1);
	ctx.fillText(minStr, tx -1- ctx.measureText(minStr).width, ty+th-1);
	
	for (var i=0; i<tw; i+=scaleX)
	{		
		
	}
	ctx.stroke();

	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = this.gridColor;
	ctx.rect(tx+0.5, ty+0.5, tw, th);
	ctx.stroke();
}

OuttaTimeline.prototype.drawTrack = function(index)
{
	if (index < 0 || index >= this.count()) return;

	var track = this.tracks[index];	if (typeof(track) === 'undefined') return;

	var ctx = track.getCanvasContext();	if (ctx == null) return;

	var w = this.width();
	var h = this.height();
	var th = this.trackHeight;
	var sX = this.scaleX;

	ctx.clearRect(0,0,w,h);

	ctx.beginPath();

	var defY = track.getVisualY(track.def);

	var points = new Array();

	for (var i = 0; i<track.points.length; i++)
	{
		var p = track.points[i];
		var x = p[0];
		var y = p[1];
		var vx = track.baseX + x*sX;
		var vy = track.getVisualY(y);
		points.push([vx, vy]);
	}

	var prev = points[0];
	ctx.moveTo(prev[0], prev[1]);

	for (var i = 1; i<points.length; i++)
	{
		var p = points[i];
		//singleLine(ctx, prev[0], prev[1], p[0], p[1]);
		ctx.lineTo(p[0], p[1]);
		prev = p;
	}

	if (track.lineStyle == 'fill')
	{
		var p0 = points[0];
		var pL = points[points.length - 1];
		ctx.lineTo(pL[0], defY);
		ctx.lineTo(p0[0], defY)

		ctx.fillStyle = track.color;
		ctx.fill();

		ctx.lineWidth = 1;
		ctx.strokeStyle = track.color;
		ctx.stroke();
	}
	else
	{
		ctx.lineWidth = track.lineStyle;
		ctx.strokeStyle = track.color;
		ctx.stroke();
	}

	//Baseline
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#FFF";
	var y_def = track.getVisualY(track.def);

	singleLine(ctx, track.baseX, y_def, track.width+track.baseX, y_def);
	ctx.stroke();

	track.knobPoints = new Array();

	for (var i = 0; i<points.length; i++)
	{
		var p = points[i];
		this.drawKnob(ctx, p[0], p[1], track.knobRadius, track.color);
		track.knobPoints[track.knobPoints.length] = [p[0], p[1]];
	}
}

OuttaTimeline.prototype.drawGrid = function()
{
	var w = this.width();
	var h = this.height();
	var c = this.gridElement;
	var ctx = this.gridCanvasContext;

	c.width = w;
	c.height = h;
	ctx.width = w;
	ctx.height = h;

	ctx.clearRect(0,0,w,h);

	return;

	//TODO: Common grid is not used at this moment, maybe it should be removed
}

OuttaTimeline.prototype.drawOverlay = function()
{
	var w = this.width();
	var h = this.height();
	var ctx = this.overlayContext;

	if (ctx == null) return;

	ctx.clearRect(0, 0, w, h);

	if (this.isMouseOver)
	{
		var mx = this.cursorPos[0];
		var my = this.cursorPos[1];

		if (this.keyControl || this.keyAlt)
		{
			var px = mx - 10;
			var py = my - 10;

			ctx.beginPath();
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#FFF';

			//Plus (vertical part)
			if (this.keyControl)
			{
				ctx.moveTo(px+4, py + 0);
				ctx.lineTo(px+4, py + 8);
			}

			//Minus (horizontal part)
			ctx.moveTo(px + 0, py + 4);
			ctx.lineTo(px + 8, py + 4);


			ctx.stroke();
		}

		var pointer = false;
		var ts = this.trackSpacing;
		var ts2 = ts/2;
		for (var i = 0; i<this.tracks.length; i++)
		{
			var t = this.tracks[i];

			if (inRange(mx, my, t.boundingTopX-ts2, t.boundingTopY-ts2, t.boundingBottomX+ts2, t.boundingBottomY+ts2))
			{
				ctx.fillStyle = "white";
				ctx.fillText(t.getRealValueFromY(my)+t.dimension, mx+10, my);

				if (this.knobDragging)
				{
					pointer =true;
				}
				else
				{
					for (var j = 0; j < t.knobPoints.length; j++)
					{
						var k = t.knobPoints[j];
						var kx = k[0];
						var ky = k[1];

						if (Math.abs(mx - kx) < 5 && Math.abs(my - ky) < 5)
						{
							this.knobIndex = j;
							this.knobStartPos = [mx, my];
							this.knobOriginalPoint = [t.points[j][0], t.points[j][1]];
							this.knobTrackIndex = i;
							pointer = true;
							break;
						}
					}
				}

				break;
			}
		}

		if (!pointer)
		{
			this.knobIndex = -1;
			this.knobStartPos = [0, 0];
			this.knobOriginalPoint = [0, 0];
			this.knobTrackIndex = -1;
		}

		this.overlayCanvas.toggleClass("pointer", pointer);
	}
	
	ctx.beginPath();
	ctx.lineWidth = 2;
	ctx.strokeStyle = '#FC0';
	ctx.globalAlpha = 0.8;
	
	var timeX = this.headerWidth + this.trackSpacing+ this.time*this.scaleX;
	
	ctx.moveTo(timeX, 0);
	ctx.lineTo(timeX, this.height());

	ctx.stroke();
	
	ctx.globalAlpha = 1;
}

OuttaTimeline.prototype.drawKnob = function(ctx, x, y, radius = 5, color = "#C30")
{
	//var gradient = ctx.createRadialGradient(x,y,radius/4, x,y,radius);

	//// Add three color stops
	//gradient.addColorStop(0, "#C30");
	//gradient.addColorStop(1, '#910');

	// Fill with gradient
	ctx.fillStyle = color;
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#FFF";

	ctx.beginPath();
	ctx.ellipse(x, y, radius, radius, 0, 0, 2 * Math.PI);
	ctx.fill();
	ctx.stroke();
}

OuttaTimeline.prototype.count = function()
{
	return this.tracks.length;
}