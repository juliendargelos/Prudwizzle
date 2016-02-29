/////////////////////////////////- Created by -/////////////////////////////////
//                                                                            //
//                              JULIEN  DARGELOS                              //
//                           www.juliendargelos.com                           //
//                                                                            //
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////
// CONSTRUCTORS                                                               //
////////////////////////////////////////////////////////////////////////////////

// AjaxQuery constructor (make smart AJAX requests)
var AjaxQuery=function(url,data,callback,async,method,wait) {
	this.url=url;
	this.data=typeof data=='object' ? data : {};
	this.callback=typeof callback=='function' ? callback : function(){};
	this.async=typeof async=='boolean' ? async : true;
	this.method=typeof method=='string' ? (method.toUpperCase()=='POST' || method.toUpperCase()=='GET' ? method.toUpperCase() : 'GET') : 'GET';

	// Convert object into HTTP data
	this.dataEncode=function(data,tree) {
		if(typeof tree!='string') tree='';
		var params='';
		for(var p in data) {
			if(typeof data[p]=='string' || typeof data[p]=='number' || typeof data[p]=='boolean') params+=tree+(tree==''?p:'['+p+']')+'='+encodeURIComponent(data[p])+'&';
			else if(typeof data[p]=='object') params+=this.dataEncode(data[p],tree+(tree==''?p:'['+p+']'));
		}
		return params.replace(/&$/,'');
	}

	Object.defineProperty(this,'params',{
		get:function(){return this.dataEncode(this.data);}
	});

	// Send the request
	this.send=function() {
		var req=new XMLHttpRequest();
		req.open(this.method,this.url,this.async);
        if(this.method=='POST') req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
		if(this.async==true) {
			var ajaxQuery=this;
			req.onreadystatechange=function() {
				if(req.readyState==4) {
					if(req.status==200) ajaxQuery.callback({status:'completed',data:req.responseText});
					else ajaxQuery.callback({status:'error'});
				}
			};
			req.onprogress=function(e) {
				ajaxQuery.callback({status:'progress',progress:(e.position/e.totalSize)*100});
			};
			req.onerror=function() {
				ajaxQuery.callback({status:'error'});
			};
			req.send(this.params);
		}
		else {
			req.send(this.params);
			if(req.status==0) this.callback({status:'completed',data:req.responseText});
			else this.callback({status:'error'});
		}
	};

	// Send the request on instantiation if specified
	if(wait!==true) this.send();
};

// Script constructor (load asynchronous scripts)
var Script=function(src,callback,wait) {
	this.src=typeof src=='string' ? [src] : src;
	this.callback=typeof callback=='function' ? callback : function(){};
	this.loadCount=0;

	// Execute the script when all scripts are loaded
	this.loaded=function(e) {
		this.loadCount++;
		if(this.loadCount>=Object.keys(this.src).length) this.callback(e);
	};

	// Execute the scripts
	this.exec=function() {
		if(typeof this.src=='object') {
			var self=this;
			for(var i in this.src) {
				var script=document.createElement('script');
		        script.type="text/javascript";
		        script.async=true;
		        script.src=this.src[i];
		        script.addEventListener('load',function(e){self.loaded(e);},false);
		        document.getElementsByTagName('head')[0].appendChild(script);
			}
		}
		else return false;
	};

	// Execute the scripts on instantiation if specified
	if(wait!==true) this.exec();
}

// Animation constructor (make animations)
var Animation=function(draw,duration,fps,ease,wait) {
    if(typeof draw!='function') return;

    var animation=this;

    Object.defineProperty(this,'fps',{
        get:function(){return 1000/this.interval;},
        set:function(value){if(typeof value=='number'){if(value>0) this.interval=1000/value;}}
    });

    this.duration=typeof duration=='number' ? duration : 500;
    this.interval=typeof fps=='number' ? (fps>0 ? 1000/fps : 1000/30) : 1000/30;
    this.now;
    this.timeOut;
    this.frameRequest;
    this.d=draw;
    this.ease=typeof ease=='number' ? ease : 0;

	// Fire on frame requests, calculate the evolution of the animation according to the ease value
    this.draw=function() {
        var now=Date.now();
        var delta=now-animation.now;
        if(delta>0) {
            var easeF=-Math.pow(animation.timeOut/animation.duration-0.5,2)+0.25;
            animation.timeOut+=animation.ease==0 ? delta : delta*animation.ease*easeF+1;
            if(animation.timeOut>animation.duration) {
                animation.d(1);
                if(animation.requestFrame!==undefined) window.cancelAnimationFrame(animation.requestFrame);
                return;
            }
            if(delta>=animation.interval) {
                animation.now+=delta;
                animation.d(animation.timeOut/animation.duration);
            }
        }
        animation.frameRequest=window.requestAnimationFrame(animation.draw);
    };

	// Fire the animation
    this.fire=function() {
        this.now=Date.now();
        this.timeOut=0;
        this.draw();
    };

	// Fire the animation on instantiation if specified
	if(wait!==true) this.fire();
};

// Product constructor (data about a product)
var Product=function(element) {
	if(!(element instanceof Node)) element=document.createElement('div');
	Object.defineProperties(this,{
		element:{
			get:function(){return element;}
		},
		elements:{
			get:function() {
				var elements={};
				var children=element.querySelectorAll('*');
				for(var i=0; i<children.length; i++) {
					if(typeof children[i].tagName=='string') {
						if(typeof children[i].className=='string' && children[i].className!='') elements[children[i].className.split(' ')[0]]=children[i];
						else elements[children[i].tagName.toLowerCase()]=children[i];
					}
				}
				return elements;
			}
		},
		data:{
			get:function() {
				var data={};
				var elements=this.elements;
				for(var k in elements) {
					(function(element,k) {
						if(element.innerText!='') {
							Object.defineProperty(data,k,{
								get:function(){return element.innerText;},
								set:function(value){element.appendChild(document.createTextNode(value));}
							});
						}
						else if(element.attributes.length>0) {
							var attribute=element.attributes[0].name;
							Object.defineProperty(data,k,{
								get:function(){return element.getAttribute(attribute);},
								set:function(value){element.setAttribute(attribute,value);}
							});
						}
					})(elements[k],k);
				}
				return data;
			}
		}
	});

	var product=this;

	this.add=function(){basket.add(this);};
	element.product=this;

	if(this.elements.add) crossClick(this.elements.add,function(event) {
		basket.open();
		product.add();
	});
}

// LightBox constructor (display a message into a lightbox)
var LightBox=function(message,callback,wait) {
	var element=document.createElement('div');
	var content=document.createElement('div');
	var p=document.createElement('p');
	var span=document.createElement('span');

	element.className='popup';

	span.appendChild(document.createTextNode('Fermer'));
	p.appendChild(document.createTextNode(message));
	content.appendChild(p);
	content.appendChild(span);
	element.appendChild(content);

	var lightBox=this;

	this.append=function() {
		document.body.appendChild(this.element);
	};

	this.close=function() {
		this.element.className+=' out';
		setTimeout(function(){lightBox.element.parentNode.removeChild(lightBox.element);},300);
	};

	crossClick(span,function(){if(lightBox.callback()!==false) lightBox.close();});

	Object.defineProperties(this,{
		element:{
			get:function(){return element;}
		},
		message:{
			get:function(){return p.innerText;},
			set:function(value){p.appendChild(document.createTextNode(value));}
		},
		callback:{
			get:function(){return typeof callback=='function' ? callback : function(){};},
			set:function(value){callback=value;}
		}
	});

	if(this.wait!==true) this.append();
};

////////////////////////////////////////////////////////////////////////////////
// FUNCTIONS                                                                  //
////////////////////////////////////////////////////////////////////////////////

// offsetOf function (get the real offset of elements)
function offsetOf(element) {
    var offset={top:0,left:0,width:element.offsetWidth,height:element.offsetHeight};
    while(element) {
        offset.top+=parseInt(element.offsetTop);
        offset.left+=parseInt(element.offsetLeft);
        element=element.offsetParent
    }
    return offset;
}

// crossClick function (make cross "clickable/touchable" elements)
function crossClick(element,callback) {
	if(typeof element.onclick!='function') element.onclick=function(){return false;}
	if(typeof element.ontouchend!='function') element.ontouchend=function(){return false;}
	element.addEventListener('click',function(event) {
		if(!client.touch) {
			if(callback(event,element)===false) event.preventDefault();
		}
	});
	element.addEventListener('touchend',function(event) {
		if(client.touch) {
			if(callback(event,element)===false) event.preventDefault();
		}
	});
};

////////////////////////////////////////////////////////////////////////////////
// OBJECTS                                                                    //
////////////////////////////////////////////////////////////////////////////////

// Scroll object (cross browser scrollTop and smooth scroll)
var scroll={
	get top(){return document.body.scrollTop || document.documentElement.scrollTop;},
    set top(value){document.body.scrollTop=document.documentElement.scrollTop=value;},
	last:0,
	direction:0,
	// Smooth scroll to a specified position
	to:function(to,duration,ease) {
	    var from=document.body.scrollTop || document.documentElement.scrollTop;
	    var delta=to-from;
	    new Animation(function(p) {
	        document.body.scrollTop=document.documentElement.scrollTop=p*to+from*(1-p);
	    },typeof duration=='number' ? duration : 600,300,typeof ease=='number' ? ease : 5);
	},
	// Detect anchor links to apply smooth scroll on them
	target:function(element) {
		console.log(element);
	    if(element instanceof Node) {
	        if(element.tagName=='A') {
				var href=element.getAttribute('href');
				if(typeof href=='string' ? href[0]=='#' : false) {
	            	crossClick(element,new Function("var target=document.getElementById('"+href.substr(1)+"');if(target) scroll.to(offsetOf(target).top-timelapse.header.height,1000);return false;"));
				}
	        }
	        else {
	            var items=element.getElementsByTagName('a');
	            for(var i=0; i<items.length; i++) scroll.target(items[i]);
	        }
	    }
	},
	// Detect and fire elements in the visible window frame
    fire:{
        get margin(){return window.innerHeight*0.025},
        listeners:[],
		// Return true if the specified element is above the visible window frame
        up:function(element,margin) {
            if(typeof margin!='number') margin=0;
			var offset=offsetOf(element);
			return scroll.top+margin>=offset.top+offset.height;
        },
		// Return true if the specified element is below the visible window frame
        down:function(element,margin) {
			if(typeof margin!='number') margin=0;
			var offset=offsetOf(element);
			return scroll.top-margin<offset.top-window.innerHeight;
		},
		// Return true if the specified element is in the visible window frame
        visible:function(element,margin) {
			return !this.up(element,margin) && !this.down(element,margin);
		},
		// Return the state of the specified element (above: 1, visible: 0, below: -1)
        stateOf:function(element,margin) {
            return this.down(element,margin) ? -1 : (this.up(element,margin) ? 1 : 0)
        },
		// Fire elements (waiting for fire) in the visible window frame
        update:function() {
            if(this.listeners.length>0) {
                var listeners=[];
                for(var i=0; i<this.listeners.length; i++) {
                    var listener=this.listeners[i];
                    if(listener.state==-listener.direction || (listener.state==0 && (listener.from==0 || listener.from==listener.direction))) listener.element.setAttribute('data-scrollfire','true');
                    else {
                        listener.from=listener.state;
                        listeners.push(listener);
                    }
                }
                this.listeners=listeners;
            }
        },
		// Initialize object: detect and store elements waiting for fire, add a scroll listener
        init:function() {
			var elements=document.querySelectorAll('*');
			for(var i=0; i<elements.length; i++) {
				var scrollFire=elements[i].getAttribute('data-scrollfire');
				if(scrollFire!==null) {
					elements[i].setAttribute('data-scrollfire','false');
					this.listeners.push({
                        element:elements[i],
                        get state(){return scroll.fire.stateOf(this.element,scroll.fire.margin+this.element.offsetHeight);},
                        from:this.stateOf(elements[i],this.margin),
                        direction:scrollFire=='down' ? -1 : (scrollFire=='up' ? 1 : 0)
                    });
				}
			}
			window.addEventListener('scroll',function(){scroll.fire.update();});
		}
    },
	// Initialize object: add a scroll listener to update scroll direction
	init:function() {
		window.addEventListener('scroll',function(){
			var scrollTop=scroll.top;
			scroll.direction=scrollTop>scroll.last ? 1 : (scrollTop<scroll.last ? -1 : 0);
			if(scrollTop!=scroll.last) scroll.last=scrollTop;
		});

		this.fire.init();
	}
};

// Client object (informations about the client browser and device)
var client={
    userAgent:navigator.userAgent.toLowerCase(),
	// Return true if the user agent include at least one of the specified strings or regexps
    is:function() {
        var is=false;
        for(var i=0; i<arguments.length; i++) {
            if((arguments[i] instanceof RegExp ? this.userAgent.match(arguments[i])!=null : this.userAgent.indexOf(arguments[i])!=-1)===true) is=true;
        }
        return is;
    },
	breakPoint:1060,
	// return true if the screen match with a mobile
	get mobile(){return window.innerWidth<=this.breakPoint;},
	// return true if touch events are available
	get touch(){return 'ontouchstart' in window || navigator.maxTouchPoints;},
	// Initialize the object: manage touched elements
	init:function() {
		window.ontouchend=function() {
			var touched=document.getElementsByClassName('touched');
			for(var i=0; i<touched.length; i++) touched[i].className=touched[i].className.replace(/\btouched\b/g,'');
		}
	}
};

// Header object (timelapse animation)
var header={
	element:document.getElementsByTagName('header')[0],
	// Initialize object (nothing to do)
    init:function() {}
};

// Timelapse object (timelapse animation)
var timelapse={
    element:document.getElementById('timelapse'),
    get height(){return this.element.offsetHeight;},
    get width(){return this.element.offsetWidth;},
    get scrollRatio() {
        var height=this.height-this.header.height;
        return (scroll.top>height ? height : scroll.top)/height;
    },
	// Scroll to the bottom of the timelapse element
    autoScroll:function() {
        scroll.to(this.height-this.header.height,700);
    },
	// Convert rgb(a) objects into strings
    rgb:function(rgb) {
        return 'rgb'+(typeof rgb.a=='number' ? 'a' : '')+'('+Math.round(rgb.r)+','+Math.round(rgb.g)+','+Math.round(rgb.b)+(typeof rgb.a=='number' ? ','+rgb.a : '')+')';
    },
	// Manage the video loading, progress and size
    video:{
        element:null,
        get width(){return this.element.offsetWidth;},
        set width(value){this.element.style.width=value;},
        get height(){return this.element.offsetHeight;},
        set height(value){this.element.style.height=value;},
        set left(value){this.element.style.left=typeof value=='number' ? value+'px' : value;},
        set top(value){this.element.style.top=typeof value=='number' ? value+'px' : value;},
        sources:{
            'mp4':'medias/timelapse.mp4'
        },
        ratio:null,
        set timeRatio(ratio) {
            this.element.currentTime=ratio*this.element.duration;
        },
		// Resize the video according to the screen size
        resize:function(r) {
            if(timelapse.width/this.ratio<this.height) {
                this.height='100%';
                this.width='auto';
                this.left=-(this.width-timelapse.width)/2;
                this.top=0;
            }
            else {
                this.height='auto';
                this.width='100%';
                this.left=0;
                this.top=-(this.height-timelapse.height)/2;
            }
            if(r!==true) this.resize(true);
        },
		// Update (nothing to do)
        update:function() {},
		// Initialize object: load the video only for safari on OS X, add a loading listener
        init:function() {
            if(client.is('safari') && !client.is('chrome','iphone','ipod','ipad')) {
                this.element=document.createElement('video');
                for(var type in this.sources) {
                    var source=document.createElement('source');
                    source.type='video/'+type;
                    source.src=this.sources[type];
                    this.element.appendChild(source);
                }
                timelapse.element.appendChild(this.element);
                this.element.oncanplay=function() {
                    timelapse.video.ratio=timelapse.video.width/timelapse.video.height;
                    timelapse.video.update=function(){this.timeRatio=timelapse.scrollRatio;};
                    window.onresize=function() {timelapse.video.resize();};
                    timelapse.video.update();
                    timelapse.video.resize();
                };
            }
        }
    },
	// Manage the title translations and opacity
    title:{
        element:document.getElementById('main-title'),
        translationSpeeds:[],
		// Translate letters and set opacity according to the scroll
        update:function() {
            this.element.style.opacity=1-timelapse.scrollRatio;
            for(var i=0; i<this.element.getElementsByTagName('div').length; i++) {
                this.element.getElementsByTagName('div')[i].style.top=-scroll.top*this.translationSpeeds[i]+'px';
            }
        },
		// Initialize object: allocate random translation speeds to the letters
        init:function() {
            for(var i=0; i<this.element.getElementsByTagName('span').length; i++) {
                var span=this.element.getElementsByTagName('span')[i];
                var str=span.innerHTML;
                span.innerHTML='';
                for(var j=0; j<str.length; j++) {
                    var div=document.createElement('div');
                    div.appendChild(document.createTextNode(str[j]));
                    this.translationSpeeds.push(Math.floor((Math.random()*25)+23)/100);
                    span.appendChild(div);
                }
            }
        }
    },
	// Manage the overlay color
    overlay:{
        element:null,
        from:{r:0,g:0,b:0,a:0.2},
        to:null,
		// Return the overlay color according to the scroll
        get current() {
            return {
                r:timelapse.scrollRatio*(timelapse.overlay.to.r-timelapse.overlay.from.r)+timelapse.overlay.from.r,
                g:timelapse.scrollRatio*(timelapse.overlay.to.g-timelapse.overlay.from.g)+timelapse.overlay.from.g,
                b:timelapse.scrollRatio*(timelapse.overlay.to.b-timelapse.overlay.from.b)+timelapse.overlay.from.b,
                a:timelapse.scrollRatio*(timelapse.overlay.to.a-timelapse.overlay.from.a)+timelapse.overlay.from.a,
            };
        },
		// Update the overlay color
        update:function() {
            this.element.style.background=timelapse.rgb(this.current);
        },
		// Initialize object: set element and final color according to the header background
        init:function() {
            this.element=timelapse.element.getElementsByClassName('overlay')[0];
            this.to=timelapse.header.background;
            this.to.a=1;
        }
    },
	// Manage the discover button translation and opacity
    discover:{
        element:null,
        translationSpeed:1,
		// Update the discover button translation and opacity
        update:function() {
            this.element.style.opacity=1-timelapse.scrollRatio*5;
            this.element.style.top=(-this.translationSpeed*timelapse.scrollRatio*150)+'px';
        },
		// Initialize object: set element and add a click listener fireing autoScroll function
        init:function() {
            this.element=timelapse.element.getElementsByClassName('discover')[0];
            crossClick(this.element,function() {
				timelapse.autoScroll();
				return false;
			});
        }
    },
	// Manage the header opacity and main title (h1) translation
    header:{
		get element(){return header.element;},
        get title(){return this.element.getElementsByTagName('h1')[0];},
        get height(){return this.element.offsetHeight;},
        background:{r:64,g:80,b:84},
        from:-20,
        to:0,
		// Update the header opacity and main title (h1) translation
        update:function() {
            var ratio=timelapse.scrollRatio*8-7;
            ratio=ratio<0 ? 0 : (ratio>1 ? 1 : ratio);
            this.element.style.opacity=ratio;
            this.title.style[client.mobile ? 'top' : 'left']=ratio*(this.to-this.from)+this.from+'px';
            this.element.style.background=timelapse.scrollRatio==1 ? timelapse.rgb(this.background) : 'transparent';
			this.title.style.background=timelapse.scrollRatio==1 ? timelapse.rgb(this.background) : 'transparent';
			nav.element.style.background=timelapse.scrollRatio==1 ? timelapse.rgb(this.background) : 'transparent';
            this.title.style.cursor='pointer';
            crossClick(this.title,function(){scroll.to(0,700);nav.close();});
        },
		// Initialize object (nothing to do)
        init:function() {}
    },
	// Update object updating all sub-objects
    update:function() {
        this.video.update();
        this.title.update();
        this.overlay.update();
        this.discover.update();
        this.header.update();
    },
	// Initialize object: initialize all sub-objects and add a scroll listener
    init:function() {
        this.video.init();
        this.title.init();
        this.overlay.init();
        this.discover.init();
        this.header.init();

        this.update();

        window.addEventListener('scroll',function() {
            timelapse.update();
        });
    }
};

// Parallax object (parallax effect)
var parallax={
	sections:[],
	ratio:0.5,
	// Update background position of parallax elements
	update:function() {
		for(var i=0; i<parallax.sections.length; i++) {
			var section=parallax.sections[i];
			if(scroll.fire.visible(section)) {
				section.style.backgroundPosition='0 '+(-(scroll.top-offsetOf(section).top)*parallax.ratio)+'px';
			}
		}
	},
	// Add or remove parallax effect according to the screen size
	resize:function() {
		if(client.mobile) {
			for(var i=0; i<parallax.sections.length; i++) parallax.sections[i].style.backgroundPosition='';
			window.removeEventListener('scroll',parallax.update);
		}
		else {
			parallax.update();
			window.addEventListener('scroll',parallax.update);
		}
	},
	// Initialize object: detect parallax elements and add a resize listener
	init:function() {
		var sections=document.getElementsByTagName('section');
		for(var i=0; i<sections.length; i++) {
			if(window.getComputedStyle(sections[i]).getPropertyValue('background-image')!='none') this.sections.push(sections[i]);
		}
		this.resize();
		window.addEventListener('resize',function(){parallax.resize();});
	}
};

// Nav object (smooth scroll on items and burger)
var nav={
	element:document.getElementsByTagName('nav')[0],
	burger:document.getElementById('burger'),
	open:function(){header.element.className='nav';},
	close:function(){header.element.className='';},
	// Toogle nav
	toogle:function() {
		header.element.className=header.element.className=='nav' ? '' : 'nav';
	},
	// Initialize object: add a click listener on the burger button and items, apply smooth scroll on items
	init:function() {
		crossClick(burger,nav.toogle);
		for(var i=0; i<this.element.getElementsByTagName('a').length; i++) {
			var href=this.element.getElementsByTagName('a')[i].getAttribute('href');
			if(typeof href=='string') {
				if(href[0]=='#') {
					crossClick(this.element.getElementsByTagName('a')[i],function() {
						nav.close();
						return false;
					});
				}
			}
		}
		scroll.target(this.element);
	}
};

// Products object (get products data)
var products={
	list:[],
	init:function() {
		var productsElements=document.getElementsByClassName('product');
		for(var i=0; i<productsElements.length; i++) this.list.push(new Product(productsElements[i]));
	}
};

// Basket object
var basket={
	element:document.getElementById('basket'),
	get button(){return this.element.getElementsByClassName('button')[0];},
	get list(){return this.element.getElementsByTagName('ul')[0];},
	open:function() {
		this.element.className+=' opened';
	},
	close:function() {
		this.element.className=this.element.className.replace(/\bopened\b/g,'');
	},
	toogle:function() {
		if(this.element.className.match(/\bopened\b/)!==null) this.close();
		else this.open();
	},
	add:function(product) {
		if(!(product instanceof Product)) return false;
		var element=document.createElement('li');
		var close=document.createElement('span');
		close.className='close';

		crossClick(close,function(event) {
			element.className='out';
			setTimeout(function() {
				element.parentNode.removeChild(element);
			},300);
			if(basket.list.getElementsByTagName('li').length<=1) basket.element.className+=' empty';
			else basket.element.className=basket.element.className.replace(/\bempty\b/g,'');
			event.stopPropagation();
		});

		element.appendChild(close);
		element.appendChild(product.elements.img.cloneNode(true));
		element.appendChild(product.elements.name.cloneNode(true));
		element.appendChild(product.elements.price.cloneNode(true));

		this.list.appendChild(element);
		basket.element.className=basket.element.className.replace(/\bempty\b/g,'');
	},
	order:function() {
		new LightBox('Ce site ne vend pas de produit ! Le Prudwizzle est un objet factice, son véritable nom est "Bozo Bozo".');
	},
	init:function() {
		crossClick(this.button,function(event){basket.toogle();});
		crossClick(this.list,function(event){basket.open();});
		crossClick(this.element.getElementsByClassName('order')[0],function(){basket.order();});
	}
};

// Social object (social networks links and share buttons)
var social={
	// Manage social networks links
	networks:{
		element:document.getElementById('networks'),
		// Initialize object: add a touchstart listener
		init:function() {
			for(var i=0; i<this.element.getElementsByTagName('a').length; i++) {
				this.element.getElementsByTagName('a')[i].ontouchstart=function(){this.className+=' touched';}
			}
		}
	},
	// Manage share buttons
	share:{
		element:document.getElementById('share'),
		src:{
			facebook:'//connect.facebook.net/fr_FR/sdk.js#xfbml=1&version=v2.5',
			twitter:'//platform.twitter.com/widgets.js',
			google:'//apis.google.com/js/platform.js',
		},
		elements:{
			get facebook(){return document.getElementsByClassName('fb-like')[0];},
			get twitter(){return document.getElementById('twitter-widget-0');},
			get google(){return document.getElementById('___plusone_0');},
		},
		frameRequest:null,
		// Make share buttons visible
		update:function() {
			this.element.className='visible';
		},
		// Initialize object: load widgets scripts
		init:function() {
			new Script(this.src,function(){social.share.update();});
		}
	},
	// Initialize object: initialize all sub-objects
	init:function() {
		this.networks.init();
		this.share.init();
	}
};

// ThimbleHack object (removing of the Thimble button)
var thimbleHack={
	// Try to remove the Thimble button until success (using browser frame request)
	hack:function() {
		if(thimbleHack.iterations>thimbleHack.maxIterations) {
			cancelAnimationFrame(thimbleHack.requestFrame);
			return;
		}
		thimbleHack.iterations++;
		var element=document.getElementsByClassName('details-bar');
		if(element.length>0) element[0].parentNode.removeChild(element[0]);
		thimbleHack.requestFrame=window.requestAnimationFrame(thimbleHack.hack);
	},
	iterations:0,
	maxIterations:500,
	requestFrame:null,
	// Initialize object: hack Thimble
	init:function() {
		this.hack();
	}
};

////////////////////////////////////////////////////////////////////////////////
// INITIALISATION                                                             //
////////////////////////////////////////////////////////////////////////////////

// Initialize all objects specified in the init var when the window load
if(Array.isArray(window.init)) {
	document.body.onload=function() {
		for(var i=0; i<init.length; i++) {
			if(typeof window[init[i]]=='object') {
				if(typeof window[init[i]].init=='function') {
					try {window[init[i]].init();}
					catch(e) {}
				}
			}
		}
	};
}
