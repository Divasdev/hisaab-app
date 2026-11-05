// Every GraphQL query the screens use. One query per screen, asking for exactly the fields that
// screen shows. Compare with REST, where the server decides what each endpoint returns.
//
// Ids inside a group (paid_by, member_id, from_member_id, …) are MEMBER ids.
// Each group query asks for my_member_id, so a screen knows which member is "you".

const ACTIVITY_FIELDS = `
  fragment ActivityFields on Activity {
    id
    type
    created_at
    data
    actor { id name }
  }`;

const EXPENSE_FIELDS = `
  fragment ExpenseFields on Expense {
    id group_id description amount_paise paid_by split_type category date note
    created_at updated_at
    creator { id name }
    splits { member_id amount_paise shares }
  }`;

const PEOPLE = `
  my_member_id
  members { id name joined }
  past_members { id name }`;

/** Home: invites for me, my groups, overall balance and recent activity in ONE request. */
export const HOME_SCREEN = `
  query HomeScreen {
    my_invites {
      member_id
      name
      added_by { id name }
      group { id name kind member_count }
    }
    groups { id name kind member_count my_balance_paise total_spent_paise last_activity_at }
    my_balance { owed_to_me_paise i_owe_paise net_paise groups_owed groups_owe }
    recent_activity(limit: 10) {
      ...ActivityFields
      group { id name }
    }
  }
  ${ACTIVITY_FIELDS}`;

/** Laptop sidebar: the same groups, but only the fields it shows. */
export const SIDEBAR_GROUPS = `
  query SidebarGroups {
    groups { id name kind my_balance_paise total_spent_paise }
  }`;

/** Group screen: header, members, expenses and payments together. */
export const GROUP_SCREEN = `
  query GroupScreen($id: Int!) {
    group(id: $id) {
      id name kind my_role my_member_id my_balance_paise total_spent_paise
      members { id name upi_id role joined balance_paise }
      past_members { id name }
      expenses {
        id description amount_paise paid_by category date created_at
        splits { member_id amount_paise }
      }
      settlements { id group_id from_member_id to_member_id amount_paise method created_at }
    }
  }`;

/** Activity tab: asked for only when the tab is opened. */
export const GROUP_ACTIVITY = `
  query GroupActivity($id: Int!) {
    group(id: $id) {
      id
      activity(limit: 60) { ...ActivityFields }
    }
  }
  ${ACTIVITY_FIELDS}`;

/** Expense detail: the expense, and its group reached THROUGH the expense (a nested field). */
export const EXPENSE_SCREEN = `
  query ExpenseScreen($id: Int!) {
    expense(id: $id) {
      ...ExpenseFields
      group { id name ${PEOPLE} }
    }
  }
  ${EXPENSE_FIELDS}`;

/** Add / edit form. The @include directive skips the expense when adding a new one. */
export const EXPENSE_FORM = `
  query ExpenseForm($groupId: Int!, $expenseId: Int = 0, $editing: Boolean = false) {
    group(id: $groupId) { id name kind ${PEOPLE} }
    expense(id: $expenseId) @include(if: $editing) { ...ExpenseFields }
  }
  ${EXPENSE_FIELDS}`;

/** Settle up: members (for UPI IDs) and the payment plan. */
export const SETTLE_SCREEN = `
  query SettleScreen($id: Int!) {
    group(id: $id) {
      id name my_role my_member_id
      members { id name upi_id joined }
      past_members { id name }
      balances {
        suggested { from_member_id to_member_id amount_paise }
        pairwise { from_member_id to_member_id amount_paise }
      }
    }
  }`;

/** Members and settings. */
export const MEMBERS_SCREEN = `
  query MembersScreen($id: Int!) {
    group(id: $id) {
      id name kind my_role my_member_id
      members { id user_id name upi_id role joined invite_email balance_paise }
      past_members { id name }
    }
  }`;

/** Join page. Uses the small InviteGroup type, never Group, because you are not a member yet. */
export const INVITE_PREVIEW = `
  query InvitePreview($token: String!) {
    invite(token: $token) {
      status
      expires_at
      invited_by { id name }
      group { id name kind member_count members_preview { id name } }
      open_members { id name }
    }
  }`;
