// 요금제 목록은 홈(`/`)으로 이전됨. 중복 방지를 위해 `/plans`는 `/`로 영구 리다이렉트.
// rendering-matrix: 정적 리다이렉트(데이터·동적 API 미사용).
import { redirect } from 'next/navigation';

export default function PlansRedirectPage(): never {
  redirect('/');
}
