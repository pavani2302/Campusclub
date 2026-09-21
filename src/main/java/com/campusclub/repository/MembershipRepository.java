package com.campusclub.repository;
import com.campusclub.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface MembershipRepository extends JpaRepository<Membership,Long>{ boolean existsByClubIdAndUserId(Long clubId,Long userId); List<Membership> findByUserId(Long userId); List<Membership> findByClubId(Long clubId); }
