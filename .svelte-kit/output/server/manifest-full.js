export const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.ico","icons/stop-icon-1.png","icons/stop-icon-1.svg","icons/stop-icon-10.png","icons/stop-icon-10.svg","icons/stop-icon-11.png","icons/stop-icon-11.svg","icons/stop-icon-12.png","icons/stop-icon-12.svg","icons/stop-icon-2.png","icons/stop-icon-2.svg","icons/stop-icon-3.png","icons/stop-icon-3.svg","icons/stop-icon-4.png","icons/stop-icon-4.svg","icons/stop-icon-5.png","icons/stop-icon-5.svg","icons/stop-icon-6.png","icons/stop-icon-6.svg","icons/stop-icon-7.png","icons/stop-icon-7.svg","icons/stop-icon-8.png","icons/stop-icon-8.svg","icons/stop-icon-9.png","icons/stop-icon-9.svg","logo_green.png"]),
	mimeTypes: {".ico":"image/vnd.microsoft.icon",".png":"image/png",".svg":"image/svg+xml"},
	_: {
		entry: {"file":"_app/immutable/start-20ce2475.js","imports":["_app/immutable/start-20ce2475.js","_app/immutable/chunks/index-8049f3e1.js","_app/immutable/chunks/singletons-15f1a201.js","_app/immutable/chunks/shared-2c7187f2.js","_app/immutable/chunks/preload-helper-41c905a7.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('./nodes/0.js'),
			() => import('./nodes/1.js'),
			() => import('./nodes/2.js')
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0], errors: [1], leaf: 2 },
				endpoint: null
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};
