import { Heading } from '@chakra-ui/react'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { groupColumns } from '../../helpers/columns'
import { GroupContext } from '../../services/contexts'
import Table from '../Table'
import { Button } from '../../Embeds/Button'
import Group from '../Modals/Group'
import { groupInit } from '../../helpers/initialvalues'

const GroupList = () => {
  const { t } = useTranslation()
  const groupContext = useContext(GroupContext)
  const [showAdd, setShowAdd] = useState()
  const [showModify, setShowModify] = useState()
  const [group, setGroup] = useState()
  useEffect(() => groupContext.fetch(), [])

  const modifyGroup = async values => {
    const { id, name, maxCount } = values
    return groupContext.modify({
      id,
      name,
      maxCount: Number(maxCount)
    })
  }

  const addGroup = async values => {
    const { name, maxCount } = values
    return groupContext.add({
      name,
      maxCount: Number(maxCount)
    })
  }

  const handleRemove = (ids) => groupContext.remove(ids)

  const groups = useMemo(() => groupContext?.all?.map(g => ({
    id: g.id,
    name: g.name,
    maxCount: g.maxCount,
    visitCount: g.visitCount,
    eventCount: g.events.length,
    hidden: g.disabled ? t('yes') : t('no'),
    modifyButton: <Button onClick={() => {
      setGroup(g)
      setShowModify(true)
    }}>{t('modify')}</Button>
  })), [groupContext.all])

  const columns = useMemo(groupColumns, [])

  if (!groups) return <></>

  return (
    <>
      <Heading as='h1' style={{ paddingBottom: 30 }}>{t('groups')}</Heading>
      <Table checkboxed data={groups} columns={columns} component={e => (<>
        <Button onClick={() => setShowAdd(true)}>{t('add-group')}</Button>
        {e.checked.length > 0 && <Button onClick={() => {
          const ids = e.checked.map(v => groups[v].id)
          handleRemove(ids)
          e.reset()
        }}
        >{t('remove-selected')}</Button>}
      </>)} />
      {showAdd && <Group
        show={showAdd}
        close={() => setShowAdd(false)}
        handle={addGroup}
        title={t('create-group')}
        initialValues={groupInit}
      />}
      {showModify && <Group
        show={showModify}
        close={() => setShowModify(false)}
        handle={v => modifyGroup({ ...v, id: group.id })}
        title={t('modify-group')}
        initialValues={group ? {
          name: group.name,
          maxCount: String(group.maxCount)
        }: groupInit}
      />}
    </>
  )
}

export default GroupList
