export function formatTiming(seconds) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export function sourceLines(source) {
  const lines = [`[${source.id}] ${source.title}`, source.url, `发布机构：${source.publisher}`, `核验日期：${source.verifiedOn}`];
  if (source.localPath) lines.push(`本地资料：${source.localPath}`);
  if (source.timeRanges?.length) lines.push(`视频时间段：${source.timeRanges.join('；')}`);
  if (source.evidence) lines.push(`核验依据：${source.evidence}`);
  if (source.supports?.length) lines.push(`支持内容：${source.supports.join('；')}`);
  return lines;
}

export function slideNotes(slide, sourceMap) {
  const lines = [`建议讲解时长：${formatTiming(slide.timingSeconds)}（${slide.timingSeconds} 秒）`, '', ...slide.notes];
  if (slide.takeaway) lines.push('', `本页要点：${slide.takeaway}`);
  if (slide.footnote) lines.push(`说明：${slide.footnote}`);
  if (slide.imagePath) lines.push(`页面图片：${slide.imagePath}`);
  if (slide.sourceIds.length) {
    lines.push('', '本页来源：');
    for (const id of slide.sourceIds) {
      const source = sourceMap.get(id);
      if (!source) throw new Error(`Slide ${slide.id}: unknown source ID: ${id}`);
      lines.push(...sourceLines(source), '');
    }
  }
  return lines;
}
