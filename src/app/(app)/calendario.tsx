import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { CalendarX, SearchX } from 'lucide-react-native';
import { useAccounts, useCalendar, useDiscounts } from '@/hooks/queries';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { Screen } from '@/components/ui/Screen';
import { Panel } from '@/components/ui/Panel';
import { Text } from '@/components/ui/Text';
import { Calendar } from '@/components/ui/Calendar';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { CategoryChips } from '@/components/discounts/CategoryChips';
import { useDebounced } from '@/hooks/useDebounced';
import { Pagination } from '@/components/ui/Pagination';
import { ListSkeleton, ChartSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart } from '@/components/charts';
import { TicketGrid } from '@/components/discounts/TicketGrid';
import { formatDate, parseISODate, pad, todayISO, WEEKDAYS_SHORT } from '@/lib/dates';

export default function Calendario() {
  const { isDesktop } = useBreakpoint();
  const accounts = useAccounts();
  const [mine, setMine] = useState(true);
  const mineEffective = mine && (accounts.data?.length ?? 0) > 0;
  const [date, setDate] = useState(todayISO());
  const [month, setMonth] = useState(todayISO().slice(0, 7));
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string | null>(null);
  const [text, setText] = useState('');
  const q = useDebounced(text.trim());
  const filtered = !!category || !!q;
  const cal = useCalendar(month, mineEffective, { category, q });
  const list = useDiscounts({ mine: mineEffective, date, category, q: q || undefined, sort: q ? 'relevance' : 'value', pageSize: 12 }, page);
  const max = Math.max(1, ...(cal.data ?? []).map((d) => d.count));
  const heat = useMemo(() => Object.fromEntries((cal.data ?? []).map((d) => [d.date, d.count / max])), [cal.data, max]);
  const marks = useMemo(() => Object.fromEntries((cal.data ?? []).filter((d) => d.count).map((d) => [d.date, d.count])), [cal.data]);
  const byWeekday = useMemo(() => {
    const sums = Array(7).fill(0);
    const n = Array(7).fill(0);
    (cal.data ?? []).forEach((d) => {
      const wd = parseISODate(d.date)!.getDay();
      sums[wd] += d.count;
      n[wd] += 1;
    });
    const best = Math.max(...sums.map((s, i) => (n[i] ? s / n[i] : 0)));
    return [1, 2, 3, 4, 5, 6, 0].map((wd) => {
      const v = n[wd] ? Math.round(sums[wd] / n[wd]) : 0;
      return { label: WEEKDAYS_SHORT[wd], value: v, highlight: v === Math.round(best) && v > 0 };
    });
  }, [cal.data]);

  return (
    <Screen topInset={false} contentStyle={{ gap: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <View>
          <Text variant="h1">Calendario</Text>
          <Text tone="soft">Qué días rinden más tus cuentas este mes</Text>
        </View>
        <Chip label="Solo mis cuentas" selected={mine} onPress={() => setMine((v) => !v)} />
      </View>
      <View style={{ gap: 10 }}>
        <Input
          kind="search"
          placeholder="Busca un comercio o beneficio (ej: sushi, cine, bencina)"
          value={text}
          onChangeText={(v) => {
            setText(v);
            setPage(1);
          }}
        />
        <CategoryChips
          value={category}
          onChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        />
      </View>
      <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16, alignItems: 'flex-start' }}>
        <View style={{ width: isDesktop ? 420 : '100%', gap: 16 }}>
          <Panel>
            <Calendar
              value={date}
              onChange={(d) => {
                setDate(d);
                setPage(1);
              }}
              heat={heat}
              marks={marks}
              initialMonth={{ year: Number(month.slice(0, 4)), month: Number(month.slice(5, 7)) - 1 }}
              onMonthChange={(y, m) => setMonth(`${y}-${pad(m + 1)}`)}
              cellSize={46}
            />
          </Panel>
          <Panel title="Promedio por día de la semana">
            {cal.isLoading ? <ChartSkeleton height={160} /> : <BarChart data={byWeekday} height={170} />}
            <Text variant="caption" tone="soft">
              La barra dorada marca el día con más descuentos en promedio.
            </Text>
          </Panel>
        </View>
        <View style={{ flex: 1, width: '100%', gap: 12 }}>
          <Text variant="h3" style={{ textTransform: 'capitalize' }}>
            {formatDate(date, { weekday: true })}
          </Text>
          {list.isLoading ? (
            <ListSkeleton count={4} />
          ) : (list.data?.data.length ?? 0) === 0 ? (
            filtered ? (
              <EmptyState icon={SearchX} title="Sin resultados este día" message="Prueba otro día, otro rubro o una búsqueda más corta." />
            ) : (
              <EmptyState icon={CalendarX} title="Sin descuentos este día" message="Elige otro día del calendario; los más dorados tienen más beneficios." />
            )
          ) : (
            <>
              <TicketGrid items={list.data!.data} columns={isDesktop ? 2 : 1} />
              <Pagination page={page} pageSize={12} total={list.data!.total} onPageChange={setPage} />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}
