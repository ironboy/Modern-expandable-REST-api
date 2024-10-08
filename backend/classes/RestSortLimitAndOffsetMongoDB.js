export default class RestSortLimitAndOffset {

  // Handle sort, limit and offset in RestSearches
  static parse(parts) {
    let sort = parts.find(({ field }) => field === 'sort');
    let limit = parts.find(({ field }) => field === 'limit');
    let offset = parts.find(({ field }) => field === 'offset');
    let args = [];
    let sortVals = sort && Object.fromEntries(
      sort.value.split(',').map(x => x.trim()).map(x => x[0] === '-' ? [x.slice(1), -1] : [x, 1])
    );
    sort && args.push('sort', [sortVals]);
    limit && args.push('limit', [limit.value]);
    offset && args.push('skip', [offset.value]);
    parts = parts.filter(({ field }) => !['sort', 'limit', 'offset'].includes(field));
    return [parts, args];
  }

}