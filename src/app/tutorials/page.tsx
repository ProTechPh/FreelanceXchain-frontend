import { permanentRedirect } from 'next/navigation';

export default function TutorialsPage() {
  permanentRedirect('/help#guides');
}
