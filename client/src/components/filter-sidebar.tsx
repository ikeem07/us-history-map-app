import React, { useState } from 'react';
import { Drawer, Select, Button, Typography, Tag, Space, Input } from 'antd';
import { CheckOutlined, FilterOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { Search } = Input;

export type FilterSidebarProps = {
  embedded?: boolean; // if true, always visible on the side; if false, toggleable drawer
  selectedTags: string[];
  selectedPeople: string[];
  allTags: string[];
  allPeople: string[];
  onChangeTags: (tags: string[]) => void;
  onChangePeople: (people: string[]) => void;
  onClear: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const FilterSidebar: React.FC<FilterSidebarProps> = ({
  embedded = false,
  selectedTags,
  selectedPeople,
  allTags,
  allPeople,
  onChangeTags,
  onChangePeople,
  onClear,
  mobileOpen,
  onMobileClose
}) => {
  const [legacyOpen, setLegacyOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChangeTags(selectedTags.filter((t) => t !== tag));
    } else {
      onChangeTags([...selectedTags, tag]);
    }
  };

  const filteredTags = allTags.filter((tag) =>
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  const FilterContent = (
    <>
      <Title level={5}>Tags</Title>
      <Search
        placeholder="Search tags"
        value={tagSearch}
        onChange={(e) => setTagSearch(e.target.value)}
        style={{ marginBottom: 8 }}
        allowClear
      />
      <div 
        style={{ 
          minHeight: 240,
          height: 240,
          resize: 'vertical', 
          overflowY: 'auto',
          marginBottom: 8,
          padding: 4,
          border: '1px solid #d9d9d9',
          borderRadius: 4,
          display: 'block'
        }}
      >
        <Space wrap>
          {filteredTags.map(tag => (
            <Tag
              key={tag}
              color={selectedTags.includes(tag) ? 'blue' : 'default'}
              onClick={() => toggleTag(tag)}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              {tag} {selectedTags.includes(tag) && <CheckOutlined />}
            </Tag>
          ))}
        </Space>
      </div>

      <Button
        size='small'
        onClick={() => onChangeTags([])}
        style={{ 
          marginBottom: 16, 
          backgroundColor: '#fff1f0', 
          borderColor: '#ffa39e', 
          color: '#cf1322' 
        }}
      >
        Clear Tag Selection
      </Button>

      <Title level={5}>People</Title>
      <Select
        mode="multiple"
        allowClear
        placeholder="Select people"
        style={{ width: '100%', marginBottom: 16 }}
        value={selectedPeople}
        onChange={(people) => onChangePeople(people)}
      >
        {allPeople.map((person) => (
          <Option key={person} value={person}>
            {person}
          </Option>
        ))}
      </Select>

      <Button 
        block
        onClick={onClear}
        style={{ 
          backgroundColor: '#fff1f0', 
          borderColor: '#ffa39e', 
          color: '#cf1322' 
        }}
      >
        Clear Filters
      </Button>
    </>
  );

  // 1) Embedded desktop mode: render content inline (no Drawer, no launcher)
  if (embedded) {
    return (
      <div
        style={{
          padding: 12,
          borderRight: '1px solid #eee',
          height: '100%',
          overflowY: 'auto',
          backgroundColor: '#fff'
        }}
      >
        {FilterContent}
      </div>
    )
  }

  // 2) Controlled Drawer mode (mobile): MapView shows the "Filters" button, we only render the Drawer.
  //    Single click opens the drawer with the filters content immediately.
  if (typeof mobileOpen === 'boolean') {
    return (
      <Drawer
        placement='left'
        open={mobileOpen}
        onClose={onMobileClose}
        width="85vw"
        getContainer={false}               // render inside page to avoid z-index surprises
        maskClosable
        title="Filters"
        styles={{
          header: { padding: '8px 12px' },
          body: { padding: 12 }
        }}
      >
        {FilterContent}
      </Drawer>
    )
  }

  // 3) Legacy self-managed mode (fallback): keep your old launcher + Drawer behavior
  return (
    <>
      {!legacyOpen && (
        <Button
          type="primary"
          icon={<FilterOutlined />}
          style={{ position: 'absolute', top: 20, left: 20, zIndex: 1100 }}
          onClick={() => setLegacyOpen(true)}
        >
          Filters
        </Button>
      )}

      <Drawer
        title="Filter Events"
        placement="left"
        onClose={() => setLegacyOpen(false)}
        open={legacyOpen}
        width={280}
        mask={false}
        styles={{ header: { padding: '8px 12px' }, body: { padding: 12 } }}
      >
        {FilterContent}
      </Drawer>
    </>
  );
};

export default FilterSidebar;
