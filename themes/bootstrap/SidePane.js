define(function(){ return '\
.d-side-pane {\
  width: 15em;\
  height: 100%;\
  top: 0;\
  box-sizing: border-box;\
  position: fixed;\
  background-color: white;\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-no-select {\
  -webkit-touch-callout: none;\
  -webkit-user-select: none;\
  -khtml-user-select: none;\
  -moz-user-select: none;\
  -ms-user-select: none;\
  user-select: none;\
}\
.-d-side-pane-start {\
  left: 0;\
  border-right: solid black 1px;\
}\
.-d-side-pane-end {\
  right: 0;\
  border-left: solid black 1px;\
}\
.-d-side-pane-start.-d-side-pane-push.-d-side-pane-hidden,\
.-d-side-pane-start.-d-side-pane-overlay.-d-side-pane-hidden {\
  -webkit-transform: translate3d(-15em, 0px, 0px);\
  transform: translate3d(-15em, 0px, 0px);\
}\
.-d-side-pane-start.-d-side-pane-push.-d-side-pane-visible,\
.-d-side-pane-start.-d-side-pane-overlay.-d-side-pane-visible {\
  display: "";\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
}\
.-d-side-pane-end.-d-side-pane-push.-d-side-pane-hidden,\
.-d-side-pane-end.-d-side-pane-overlay.-d-side-pane-hidden {\
  right: 0;\
  -webkit-transform: translate3d(15em, 0px, 0px);\
  transform: translate3d(15em, 0px, 0px);\
}\
.-d-side-pane-end.-d-side-pane-push.-d-side-pane-visible,\
.-d-side-pane-end.-d-side-pane-overlay.-d-side-pane-visible {\
  display: "";\
  right: 0;\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
}\
.-d-side-pane-start.-d-side-pane-translated {\
  -webkit-transform: translate3d(15em, 0px, 0px);\
  transform: translate3d(15em, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-start.-d-side-pane-nottranslated {\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-end.-d-side-pane-translated {\
  -webkit-transform: translate3d(-15em, 0px, 0px);\
  transform: translate3d(-15em, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-end.-d-side-pane-nottranslated {\
  -webkit-transform: translate3d(0px, 0px, 0px);\
  transform: translate3d(0px, 0px, 0px);\
  -moz-transition: -moz-transform 0.3s ease-in-out;\
  -webkit-transition: -webkit-transform 0.3s ease-in-out;\
  -ms-transition: -mstransform 0.3s ease-in-out;\
  transition: transform 0.3s ease-in-out;\
}\
.-d-side-pane-end.-d-side-pane-reveal.-d-side-pane-visible,\
.-d-side-pane.-d-side-pane-end-reveal.-d-side-pane-hidden {\
  right: 0;\
}\
'; } );
