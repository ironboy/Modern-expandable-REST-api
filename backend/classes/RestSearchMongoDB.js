import { ObjectId } from 'mongodb';
import RestSortLimitAndOffset from './RestSortLimitAndOffsetMongoDB.js';

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

    // If no query part in url, then return empty findQuery
    if (!query) { return { findQuery: [], sortLimitAndOffsetArgs: [] }; }

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
        field === '_id' && (value = ObjectId.createFromHexString(value));
        return {
          logicalOp, field, comparisonOp, value: value !== '' && !isNaN(value) ? +value : value
        };
      });

      // Treat sort,limit and offset differently than normal fields
      let sortLimitAndOffsetArgs;
      [parts, sortLimitAndOffsetArgs] = RestSortLimitAndOffset.parse(parts);

      // For our MongoDB variant of RestSearch, we do not allow a mix of AND and OR logical operators
      // (since it is hard to build an 'mixed' query when no precedences are given)
      const hasAnd = !!parts.find(x => x.logicalOp === 'AND');
      const hasOr = !!parts.find(x => x.logicalOp === 'OR');
      const hasLogicalMix = hasAnd && hasOr;
      if (hasLogicalMix) {
        return {
          error: 'The Rest-API does support mixing the logical operators AND and OR.'
        }
      }

      // Build the find-query
      let findQuery = [];
      const translateOperators = {
        '!=': '$ne', '>=': '$gte', '<=': '$lte', '=': '$eq', '>': 'gt', '<': '$lt',
        LIKE: '$regex', 'NOT LIKE': '$regex'
      };
      for (let { field, comparisonOp, value } of parts) {
        if (comparisonOp === 'LIKE') { value = value.replaceAll('%', '.*'); }
        let qpart = { [field]: { [translateOperators[comparisonOp]]: value } };
        // make LIKE and NOT LIKE case insensitive
        if (comparisonOp.includes('LIKE')) { qpart[field].$options = 'i'; }
        // handle NOT LIKE (negate regex)
        if (comparisonOp === 'NOT LIKE') { qpart[field] = { $not: qpart[field] }; }
        findQuery.push(qpart);
      }
      // apply $and or $or if needed
      findQuery = parts.length < 2 ? findQuery : [{ [hasOr ? '$or' : '$and']: findQuery }];
      // return the find-query
      return { findQuery, sortLimitAndOffsetArgs };
    }

    // If we could not build a search expression, then return an error
    catch (_error) { return { error: 'Could not search...' }; }
  }

}