import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient, { getErrorMessageKey } from '../../api/apiClient.js';
import Alert from '../../components/Alert.jsx';
import Button from '../../components/Button.jsx';
import Checkbox from '../../components/Checkbox.jsx';
import Modal from '../../components/Modal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ResourceState from '../../components/ResourceState.jsx';
import SelectField from '../../components/SelectField.jsx';
import TextField from '../../components/TextField.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useDocumentTitle from '../../hooks/useDocumentTitle.js';
import { useApiResource } from '../../hooks/useApiResource.js';
import { fieldMessage, personName } from '../../utils/fields.js';
import { formatAmount, formatDate, formatDateOnly } from '../../utils/format.js';
import { parseAmountToCents } from '../../utils/money.js';
import styles from '../module.module.css';

const CATEGORIES = ['rent', 'groceries', 'bills', 'household', 'transport', 'leisure', 'other'];

const EMPTY_FORM = {
  amount: '',
  payerId: '',
  date: '',
  category: 'groceries',
  description: '',
  participantIds: [],
};

function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function ExpensesPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const householdId = user?.householdId;
  const [expensePage, setExpensePage] = useState(1);
  const [settlementPage, setSettlementPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [pendingDebt, setPendingDebt] = useState(null);
  const [settling, setSettling] = useState(false);

  useDocumentTitle(t('pages.expenses.title'));

  const load = useCallback(
    async (signal) => {
      const [household, debts, expenses, settlements] = await Promise.all([
        apiClient.get(`/households/${householdId}`, { signal }),
        apiClient.get(`/households/${householdId}/debts`, { signal }),
        apiClient.get(`/households/${householdId}/expenses`, { signal, params: { page: expensePage } }),
        apiClient.get(`/households/${householdId}/settlements`, { signal, params: { page: settlementPage } }),
      ]);
      return {
        members: household.data.members ?? [],
        debts: debts.data,
        expenses: expenses.data,
        settlements: settlements.data,
      };
    },
    [householdId, expensePage, settlementPage],
  );
  const { status, data, error, retry } = useApiResource(load);

  function openForm() {
    setForm({
      ...EMPTY_FORM,
      date: todayInputValue(),
      payerId: user.id,
      participantIds: (data?.members ?? []).map((member) => member.id),
    });
    setFormError(null);
    setFieldErrors({});
    setSuccess('');
    setFormOpen(true);
  }

  function toggleParticipant(memberId) {
    setForm((current) => {
      const selected = new Set(current.participantIds);
      if (selected.has(memberId)) selected.delete(memberId);
      else selected.add(memberId);
      return { ...current, participantIds: [...selected] };
    });
  }

  async function submitExpense(event) {
    event.preventDefault();
    const amountCents = parseAmountToCents(form.amount);
    const nextErrors = {};
    if (amountCents === null) nextErrors.amount = t('validation.codes.NOT_POSITIVE');
    if (!form.payerId) nextErrors.payerId = t('validation.required');
    if (!form.date) nextErrors.date = t('validation.required');
    if (form.participantIds.length === 0) nextErrors.participantIds = t('validation.required');
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      await apiClient.post(`/households/${householdId}/expenses`, {
        amountCents,
        payerId: form.payerId,
        date: form.date,
        category: form.category,
        description: form.description.trim(),
        participantIds: form.participantIds,
      });
      setFormOpen(false);
      setSuccess(t('expensesPage.add.success'));
      setExpensePage(1);
      retry();
    } catch (submitError) {
      setFormError(submitError);
      setFieldErrors({
        amount: fieldMessage(t, submitError, 'amountCents'),
        payerId: fieldMessage(t, submitError, 'payerId'),
        date: fieldMessage(t, submitError, 'date'),
        category: fieldMessage(t, submitError, 'category'),
        description: fieldMessage(t, submitError, 'description'),
        participantIds: fieldMessage(t, submitError, 'participantIds'),
      });
    } finally {
      setSaving(false);
    }
  }

  async function confirmSettlement() {
    if (!pendingDebt) return;
    setSettling(true);
    setFormError(null);
    try {
      const counterpartId = pendingDebt.from.id === user.id ? pendingDebt.to.id : pendingDebt.from.id;
      await apiClient.post(`/households/${householdId}/settlements`, { counterpartId });
      setPendingDebt(null);
      setSuccess(t('expensesPage.settle.success'));
      retry();
    } catch (settleError) {
      setFormError(settleError);
    } finally {
      setSettling(false);
    }
  }

  const members = data?.members ?? [];
  const debts = data?.debts?.debts ?? [];
  const balances = data?.debts?.balances ?? [];
  const expenses = data?.expenses;
  const settlements = data?.settlements;
  const historyEmpty = expenses?.total === 0 && settlements?.total === 0;

  return (
    <>
      <PageHeader
        title={t('pages.expenses.title')}
        description={t('pages.expenses.description')}
        motif="expenses"
        actions={
          <Button onClick={openForm} disabled={status !== 'ready'}>
            {t('expensesPage.add.open')}
          </Button>
        }
      />
      {success && <Alert tone="success">{success}</Alert>}
      <ResourceState
        status={status}
        error={error}
        onRetry={retry}
        loadingLabel={t('expensesPage.loading')}
        errorTitle={t('expensesPage.errorTitle')}
      >
        <div className={styles.stack}>
          <section className={`${styles.card} ${styles.cardWarm}`} aria-labelledby="balances-title">
            <h2 id="balances-title" className={styles.sectionTitle}>
              {t('expensesPage.balances.title')}
            </h2>
            {balances.length === 0 ? (
              <p className={styles.hint}>{t('expensesPage.balances.empty')}</p>
            ) : (
              <ul className={styles.list}>
                {balances.map((item) => (
                  <li key={item.member.id} className={styles.row}>
                    <span className={styles.rowTitle}>{personName(item.member, t)}</span>
                    <span
                      className={`${styles.amount} ${item.amountCents > 0 ? styles.positive : ''} ${item.amountCents < 0 ? styles.negative : ''}`}
                    >
                      {formatAmount(item.amountCents, i18n.language)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className={styles.hint}>{t('expensesPage.balances.hint')}</p>
          </section>

          <section className={styles.card} aria-labelledby="debts-title">
            <h2 id="debts-title" className={styles.sectionTitle}>
              {t('expensesPage.debts.title')}
            </h2>
            {debts.length === 0 ? (
              <p className={styles.hint}>{t('expensesPage.debts.empty')}</p>
            ) : (
              <ul className={styles.list}>
                {debts.map((debt) => {
                  const involved = debt.from.id === user.id || debt.to.id === user.id;
                  return (
                    <li key={`${debt.from.id}-${debt.to.id}`} className={styles.row}>
                      <p className={styles.rowMain}>
                        <span className={styles.rowTitle}>
                          {t('expensesPage.debts.line', {
                            from: personName(debt.from, t),
                            to: personName(debt.to, t),
                            amount: formatAmount(debt.amountCents, i18n.language),
                          })}
                        </span>
                      </p>
                      {involved && (
                        <Button variant="secondary" size="sm" onClick={() => setPendingDebt(debt)}>
                          {t('expensesPage.settle.action')}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className={styles.card} aria-labelledby="history-title">
            <h2 id="history-title" className={styles.sectionTitle}>
              {t('expensesPage.history.title')}
            </h2>
            {historyEmpty ? (
              <p className={styles.hint}>{t('expensesPage.history.empty')}</p>
            ) : (
              <>
                <h3 className={styles.meta}>{t('expensesPage.history.expenses')}</h3>
                {(expenses?.items ?? []).length === 0 ? (
                  <p className={styles.hint}>{t('expensesPage.history.noExpenses')}</p>
                ) : (
                  <ul className={styles.list}>
                    {expenses.items.map((expense) => (
                      <li key={expense.id} className={styles.row}>
                        <div className={styles.rowMain}>
                          <span className={styles.rowTitle}>
                            {t(`expensesPage.categories.${expense.category}`)}
                            {expense.description ? ` — ${expense.description}` : ''}
                          </span>
                          <span className={styles.meta}>
                            {t('expensesPage.history.paidBy', {
                              name: personName(expense.payer, t),
                              date: formatDateOnly(expense.date, i18n.language),
                            })}
                          </span>
                        </div>
                        <span className={styles.amount}>{formatAmount(expense.amountCents, i18n.language)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {expenses?.page < expenses?.totalPages && (
                  <div className={styles.pager}>
                    <Button variant="secondary" size="sm" onClick={() => setExpensePage((page) => page + 1)}>
                      {t('common.loadMore')}
                    </Button>
                  </div>
                )}

                <h3 className={styles.meta}>{t('expensesPage.history.settlements')}</h3>
                {(settlements?.items ?? []).length === 0 ? (
                  <p className={styles.hint}>{t('expensesPage.history.noSettlements')}</p>
                ) : (
                  <ul className={styles.list}>
                    {settlements.items.map((settlement) => (
                      <li key={settlement.id} className={styles.row}>
                        <div className={styles.rowMain}>
                          <span className={styles.rowTitle}>
                            {t('expensesPage.history.settledLine', {
                              from: personName(settlement.from, t),
                              to: personName(settlement.to, t),
                            })}
                          </span>
                          <span className={styles.meta}>{formatDate(settlement.createdAt, i18n.language)}</span>
                        </div>
                        <span className={styles.amount}>{formatAmount(settlement.amountCents, i18n.language)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {settlements?.page < settlements?.totalPages && (
                  <div className={styles.pager}>
                    <Button variant="secondary" size="sm" onClick={() => setSettlementPage((page) => page + 1)}>
                      {t('common.loadMore')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </ResourceState>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={t('expensesPage.add.title')}
        description={t('expensesPage.add.description')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={submitExpense} loading={saving} disabled={saving}>
              {t('expensesPage.add.submit')}
            </Button>
          </>
        }
      >
        <form className={styles.form} onSubmit={submitExpense}>
          {formError && <Alert tone="error">{t(getErrorMessageKey(formError))}</Alert>}
          <TextField
            label={t('expensesPage.add.amount')}
            hint={t('expensesPage.add.amountHint')}
            error={fieldErrors.amount}
            inputMode="decimal"
            autoComplete="off"
            value={form.amount}
            onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
            required
          />
          <SelectField
            label={t('expensesPage.add.payer')}
            error={fieldErrors.payerId}
            value={form.payerId}
            onChange={(event) => setForm((current) => ({ ...current, payerId: event.target.value }))}
            required
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t('expensesPage.add.date')}
            error={fieldErrors.date}
            type="date"
            value={form.date}
            min="2000-01-01"
            max="2100-12-31"
            onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
            required
          />
          <SelectField
            label={t('expensesPage.add.category')}
            error={fieldErrors.category}
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(`expensesPage.categories.${category}`)}
              </option>
            ))}
          </SelectField>
          <TextField
            label={t('expensesPage.add.descriptionLabel')}
            error={fieldErrors.description}
            value={form.description}
            maxLength={500}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <fieldset className={styles.checks}>
            <legend className={styles.legend}>{t('expensesPage.add.participants')}</legend>
            {members.map((member) => (
              <Checkbox
                key={member.id}
                label={member.name}
                checked={form.participantIds.includes(member.id)}
                onChange={() => toggleParticipant(member.id)}
              />
            ))}
            {fieldErrors.participantIds && <p className={styles.hint}>{fieldErrors.participantIds}</p>}
          </fieldset>
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingDebt)}
        onClose={() => setPendingDebt(null)}
        title={t('expensesPage.settle.confirmTitle')}
        description={
          pendingDebt
            ? t('expensesPage.settle.confirmBody', {
                from: personName(pendingDebt.from, t),
                to: personName(pendingDebt.to, t),
                amount: formatAmount(pendingDebt.amountCents, i18n.language),
              })
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setPendingDebt(null)} disabled={settling}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmSettlement} loading={settling} disabled={settling}>
              {t('expensesPage.settle.action')}
            </Button>
          </>
        }
      >
        {formError && pendingDebt && <Alert tone="error">{t(getErrorMessageKey(formError))}</Alert>}
      </Modal>
    </>
  );
}
