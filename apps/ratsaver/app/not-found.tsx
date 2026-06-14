import Link from 'next/link';
import { Button } from '@/shared/ui';

// 404. dynamicParams=false인 /plans/[id]의 시드 외 id 진입 시 노출. layout이 <main> 제공.

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="nums text-4xl font-extrabold tracking-tight text-primary">404</p>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-muted-foreground">
          요청하신 요금제 또는 페이지가 존재하지 않습니다.
        </p>
      </div>
      <Button asChild>
        <Link href="/">요금제 목록으로</Link>
      </Button>
    </div>
  );
}
