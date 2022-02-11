function proxied(arr, fnname) {
	return function() {
		const ret = [];
		for (const item of arr) {
			let fn = item[fnname].bind(item);
			ret.push(fn(...arguments));
		}
		return ret;
	};
}

function multiproxy(arr) {
	return new Proxy(arr, {
		get: function(obj, prop, receiver) {
			if (obj.length === 0) return undefined;

			let all_fn = true;
			const ret = obj.map(item => {
				const attr = item[prop];
				if (typeof(attr) === 'function') {
					const res = attr.bind(item);
					return res;
				} else {
					all_fn = false;
					return attr;
				}
			});

			if (all_fn) {
				return function (...args) {
					return ret.map(fn => fn(...args));
				};
			} else {
				return ret;
			}
		},
		set: function(obj, prop, val) {
			obj.forEach(item => {
				item[prop] = val;
			});
			return true;
		}
	});
}

function withattrs(obj, attrs) {
	return new Proxy(obj, {
		get: function(inst, prop, receiver) {
			if (prop in attrs) {
				return attrs[prop];
			} else {
				const val = Reflect.get(inst, prop);
				if (typeof(val) === 'function') {
					return val.bind(inst);
				} else {
					return val;
				}
			}
		}
	});
}

function withon(evt_target, evt_types, transform_event=null) {
	// allow an EventTarget to also allow
	// target.onevent = handler
	for (const evt_type of evt_types) {
		evt_target['on' + evt_type] = null;
		evt_target.addEventListener(evt_type, (event) => {
			const handler = evt_target['on' + evt_type];
			handler && handler(transform_event ? transform_event(event) : event);
		});
	}
	return evt_target;
}

module.exports = {
	'multiproxy': multiproxy,
	'withattrs': withattrs,
	'withon': withon
};