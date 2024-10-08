export default class RestSortLimitAndOffset {

  // Handle sort, limit and offset in RestSearches
  static parse(parts) {
    let sort = parts.find(({ field }) => field === 'sort');
    let limit = parts.find(({ field }) => field === 'limit');
    let offset = parts.find(({ field }) => field === 'offset');
    let sql = ''
      + (sort ? ' ORDER BY ' + sort.value.split(',').map(x => x[0] === '-' ? x.slice(1) + ' DESC' : x) : '')
      + (limit ? ' LIMIT ' + limit.value : '')
      + (offset ? ' OFFSET ' + offset.value : '');
    parts = parts.filter(({ field }) => !['sort', 'limit', 'offset'].includes(field));
    return [parts, sql];
  }

}