export default function cx(...classNames) {
  return classNames.filter(Boolean).join(' ');
}
