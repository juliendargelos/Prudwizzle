function offsetOf(element) {
    var offset={top:0,left:0};
    while(element) {
        offset.top+=parseInt(element.offsetTop);
        offset.left+=parseInt(element.offsetLeft);
        element=element.offsetParent
    }
    return offset;
}

function scrollTo(to,duration,ease) {
    var from=document.body.scrollTop || document.documentElement.scrollTop;
    var delta=to-from;
    (new Animation(function(p) {
        document.body.scrollTop=document.documentElement.scrollTop=p*to+from*(1-p);
    },typeof duration=='number' ? duration : 600,300,typeof ease=='number' ? ease : 5)).fire();
}

function scrollTarget(element) {
    if(element instanceof Node) {
        if(element.tagName=='A') {
            element.onclick=function() {
                var href=this.getAttribute('href');
                if(typeof href=='string' ? href[0]=='#' : false) {
                    var target=document.getElementById(href.substr(1));
                    if(target) scrollTo(offsetOf(target).top-timelapse.header.height,1000);
                }
                return false;
            };
        }
        else {
            var items=element.getElementsByTagName('a');
            for(var i=0; i<items.length; i++) scrollTarget(items[i]);
        }
    }
}

var client={
    userAgent:navigator.userAgent.toLowerCase(),
    is:function() {
        var is=false;
        for(var i=0; i<arguments.length; i++) {
            if((arguments[i] instanceof RegExp ? this.userAgent.match(arguments[i])!=null : this.userAgent.indexOf(arguments[i])!=-1)===true) is=true;
        }
        return is;
    }
}

var Animation=function(draw,duration,fps,ease) {
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

    this.fire=function() {
        this.now=Date.now();
        this.timeOut=0;
        this.draw();
    };
};

var timelapse={
    element:document.getElementById('timelapse'),
    get height(){return this.element.offsetHeight;},
    get width(){return this.element.offsetWidth;},
    get scroll(){return document.body.scrollTop || document.documentElement.scrollTop;},
    set scroll(value) {
        document.body.scrollTop=document.documentElement.scrollTop=value;
    },
    get scrollRatio() {
        var height=this.height-this.header.height;
        return (this.scroll>height ? height : this.scroll)/height;
    },
    autoScroll:function() {
        scrollTo(this.height-this.header.height,700);
    },
    rgb:function(rgb) {
        return 'rgb'+(typeof rgb.a=='number' ? 'a' : '')+'('+Math.round(rgb.r)+','+Math.round(rgb.g)+','+Math.round(rgb.b)+(typeof rgb.a=='number' ? ','+rgb.a : '')+')';
    },
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
        update:function() {},
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
    title:{
        element:document.getElementById('main-title'),
        translationSpeeds:[],
        update:function() {
            this.element.style.opacity=1-timelapse.scrollRatio;
            for(var i=0; i<this.element.getElementsByTagName('div').length; i++) {
                this.element.getElementsByTagName('div')[i].style.top=-timelapse.scroll*this.translationSpeeds[i]+'px';
            }
        },
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
    overlay:{
        element:null,
        from:{r:0,g:0,b:0,a:0.2},
        to:null,
        get current() {
            return {
                r:timelapse.scrollRatio*(timelapse.overlay.to.r-timelapse.overlay.from.r)+timelapse.overlay.from.r,
                g:timelapse.scrollRatio*(timelapse.overlay.to.g-timelapse.overlay.from.g)+timelapse.overlay.from.g,
                b:timelapse.scrollRatio*(timelapse.overlay.to.b-timelapse.overlay.from.b)+timelapse.overlay.from.b,
                a:timelapse.scrollRatio*(timelapse.overlay.to.a-timelapse.overlay.from.a)+timelapse.overlay.from.a,
            };
        },
        update:function() {
            this.element.style.background=timelapse.rgb(this.current);
        },
        init:function() {
            this.element=timelapse.element.getElementsByClassName('overlay')[0];
            this.to=timelapse.header.background;
            this.to.a=1;
        }
    },
    discover:{
        element:null,
        translationSpeed:1,
        update:function() {
            this.element.style.opacity=1-timelapse.scrollRatio*5;
            this.element.style.top=(-this.translationSpeed*timelapse.scrollRatio*150)+'px';
        },
        init:function() {
            this.element=timelapse.element.getElementsByClassName('discover')[0];
            this.element.onclick=function(){timelapse.autoScroll();};
        }
    },
    header:{
	element:document.getElementsByTagName('header')[0],
        title:document.getElementsByTagName('header')[0].getElementsByTagName('h1')[0],
        get height(){return this.element.offsetHeight;},
        background:{r:64,g:80,b:84},
        from:-20,
        to:0,
        update:function() {
            var ratio=timelapse.scrollRatio*8-7;
            ratio=ratio<0 ? 0 : (ratio>1 ? 1 : ratio);
            this.element.style.opacity=ratio;
            this.title.style.left=ratio*(this.to-this.from)+this.from+'px';
            this.element.style.background=timelapse.scrollRatio==1 ? timelapse.rgb(this.background) : 'transparent';
            this.title.style.cursor='pointer';
            this.title.onclick=function(){scrollTo(0,700);}
        },
        init:function() {}
    },
    update:function() {
        this.video.update();
        this.title.update();
        this.overlay.update();
        this.discover.update();
        this.header.update();
    },
    init:function() {
        this.video.init();
        this.title.init();
        this.overlay.init();
        this.discover.init();
        this.header.init();

        this.update();

        window.onscroll=function() {
            timelapse.update();
        };
    }
};

var nav={
    element:document.getElementsByTagName('nav')[0],
    init:function() {
        scrollTarget(this.element);
    }
}

timelapse.init();
nav.init();
