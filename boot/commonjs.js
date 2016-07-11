var definitions = [];
var resolve = function (id, cache) {
    if (id === "exports")
        return {};
    if (cache[id] !== undefined)
        return cache[id];
    var definition = (definitions.some(function (definition) { return definition.id === id; }))
        ? definitions.filter(function (definition) { return definition.id === id; })[0]
        : ({ id: id, dependencies: [], factory: function () { return require(id); } });
    var dependencies = definition.dependencies.map(function (dependency) { return resolve(dependency, cache); });
    var exports = definition.factory.apply({}, dependencies);
    if (definition.dependencies.some(function (dependency) { return dependency === "exports"; }))
        exports = dependencies[definition.dependencies.indexOf("exports")];
    return cache[id] = exports;
};
var collect = function () { return resolve(definitions[definitions.length - 1].id, {
    "require": function (arg, callback) { return callback(require(arg)); }
}); };
var define = function (id, dependencies, factory) {
    return definitions.push({ id: id, dependencies: dependencies, factory: factory });
};

//--------------------------------------------
// INSERT AMD BUNDLE HERE
//--------------------------------------------

module.exports = collect();