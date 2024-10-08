import RestSortLimitAndOffset from './RestSortLimitAndOffsetSQL.js';

export default class RestSearch {

  // Parse the query part of an url into an SQL WHERE expression
  static parse(req) {

    // Some basic replacements
    // (and yes we want unescape here, not decodeURI)
    let query = unescape(req.url).split('?').slice(1).join('?')
      .replaceAll('&', '&&')
      .replaceAll('|', '||')
      .replaceAll('&&', ' AND ')
      .replaceAll('||', ' OR ');

    // If no query part in url return empty sqlWhere
    if (!query) { return { sqlWhere: '', parameters: {} }; }

    // Try parsing into logicical parts
    try {

      // Split into an array by splitting on logical operators (AND, OR)
      let parts = [];
      let lastOffset = 0, lastLogicalOp = '';
      query.replace(/( AND | OR )/g, (match, _part, offset) => {
        let logicalOp = match.trim();
        let comparison = query.slice(lastOffset, offset);
        parts.push({ logicalOp: lastLogicalOp, comparison });
        lastOffset = offset + match.length;
        lastLogicalOp = logicalOp;

      });
      parts.push({ logicalOp: lastLogicalOp, comparison: query.slice(lastOffset) });

      // Split each parts comparison into an more fine-grained object 
      // consisting of (field, comparisonOp and value)
      parts = parts.map(({ logicalOp, comparison }) => {
        let [field, comparisonOp, value] = comparison.split(/(!=|>=|<=|=|>|<)/);
        const like = value.startsWith('%') || value.endsWith('%');
        comparisonOp === '=' && like && (comparisonOp = 'LIKE');
        comparisonOp === '!=' && like && (comparisonOp = 'NOT LIKE');
        return { logicalOp, field, comparisonOp, value: value !== '' && !isNaN(value) ? +value : value };
      });

      // Treat sort,limit and offset differently than normal fields
      let sortLimitAndOffsetSql;
      [parts, sortLimitAndOffsetSql] = RestSortLimitAndOffset.parse(parts);

      // An alias function to avoid duplicate parameter names
      let usedParaNames = {};
      const alias = field => {
        let suffix = 1;
        while (usedParaNames[field + suffix]) { suffix++; }
        usedParaNames[field + suffix] = true;
        return suffix === 1 ? field : field + suffix;
      }

      // Build an SQL WHERE expression and a parameters object
      const sqlWhere = parts.map(({ logicalOp, comparisonOp, field }) =>
        ` ${logicalOp} ${field} ${comparisonOp} :${alias(field)}`).join('').trim();
      let parameters = {};
      usedParaNames = {};
      parts.forEach(({ field, value }) => parameters[alias(field)] = value);
      return { sqlWhere: (sqlWhere ? ' WHERE ' : '') + sqlWhere + sortLimitAndOffsetSql, parameters };
    }

    // If we could not build a search expression, then return an error
    catch (_error) { return { error: 'Could not search...' }; }
  }

}